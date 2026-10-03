package com.unus.one.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.unus.one.dto.SearchBenchmarkResponse;
import com.unus.one.dto.SearchBenchmarkResponse.MethodResult;
import com.unus.one.dto.SearchBenchmarkResponse.SearchPreview;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class SearchBenchmarkService {
	private static final int PREVIEW_LIMIT = 5;
	private static final int EXCERPT_LENGTH = 240;
	private static final String SQLITE_QUERY = """
			SELECT c.chunk_id, d.title, c.content
			FROM chunks c
			JOIN documents d ON d.document_id = c.document_id
			WHERE instr(lower(c.content), lower(?)) > 0
			ORDER BY c.document_id, c.chunk_index
			""";
	private static final String METHODOLOGY = "One warm-up per method is excluded. Timed runs alternate order. "
			+ "SQLite timing includes JDBC connection and query; JSON timing includes file read, parse, and scan. "
			+ "HTTP serialization is excluded. Results report server-side elapsed time, not a stable performance guarantee.";

	private final Path sqlitePath;
	private final Path jsonPath;
	private final ObjectMapper objectMapper;

	public SearchBenchmarkService(
			@Value("${demo.data.sqlite-path:data/squad-demo.sqlite3}") String sqlitePath,
			@Value("${demo.data.json-path:data/source/squad-dev-v2.0.json}") String jsonPath,
			ObjectMapper objectMapper) {
		this.sqlitePath = Path.of(sqlitePath).toAbsolutePath().normalize();
		this.jsonPath = Path.of(jsonPath).toAbsolutePath().normalize();
		this.objectMapper = objectMapper;
	}

	public SearchBenchmarkResponse compare(String query, int runs) throws IOException, SQLException {
		String normalizedQuery = query.trim();
		searchSqlite(normalizedQuery);
		searchJson(normalizedQuery);

		List<Long> sqliteSamples = new ArrayList<>(runs);
		List<Long> jsonSamples = new ArrayList<>(runs);
		Snapshot sqliteSnapshot = null;
		Snapshot jsonSnapshot = null;

		for (int i = 0; i < runs; i++) {
			if (i % 2 == 0) {
				TimedSnapshot sqlite = time(() -> searchSqlite(normalizedQuery));
				TimedSnapshot json = time(() -> searchJson(normalizedQuery));
				sqliteSamples.add(sqlite.elapsedNanos());
				jsonSamples.add(json.elapsedNanos());
				sqliteSnapshot = sqlite.snapshot();
				jsonSnapshot = json.snapshot();
			} else {
				TimedSnapshot json = time(() -> searchJson(normalizedQuery));
				TimedSnapshot sqlite = time(() -> searchSqlite(normalizedQuery));
				jsonSamples.add(json.elapsedNanos());
				sqliteSamples.add(sqlite.elapsedNanos());
				jsonSnapshot = json.snapshot();
				sqliteSnapshot = sqlite.snapshot();
			}
		}

		return new SearchBenchmarkResponse(
				normalizedQuery,
				runs,
				METHODOLOGY,
				toMethodResult("SQLite JDBC query", sqliteSamples, sqliteSnapshot),
				toMethodResult("JSON parse and scan", jsonSamples, jsonSnapshot));
	}

	private Snapshot searchSqlite(String query) throws SQLException {
		String jdbcUrl = "jdbc:sqlite:" + sqlitePath;
		try (Connection connection = DriverManager.getConnection(jdbcUrl);
				PreparedStatement statement = connection.prepareStatement(SQLITE_QUERY)) {
			statement.setString(1, query);
			try (ResultSet results = statement.executeQuery()) {
				long count = 0;
				List<SearchPreview> preview = new ArrayList<>(PREVIEW_LIMIT);
				while (results.next()) {
					count++;
					if (preview.size() < PREVIEW_LIMIT) {
						preview.add(new SearchPreview(
								results.getString("chunk_id"),
								results.getString("title"),
								excerpt(results.getString("content"))));
					}
				}
				return new Snapshot(count, List.copyOf(preview));
			}
		}
	}

	private Snapshot searchJson(String query) throws IOException {
		String json = Files.readString(jsonPath);
		JsonNode root = objectMapper.readTree(json);
		JsonNode articles = root.path("data");
		if (!articles.isArray()) {
			throw new IOException("SQuAD JSON does not contain a data array: " + jsonPath);
		}

		String normalizedQuery = query.toLowerCase(Locale.ROOT);
		long count = 0;
		List<SearchPreview> preview = new ArrayList<>(PREVIEW_LIMIT);
		int articleIndex = 0;
		for (JsonNode article : articles) {
			String documentId = "squad-v2-dev-%03d".formatted(articleIndex++);
			String title = article.path("title").asText("");
			JsonNode paragraphs = article.path("paragraphs");
			if (!paragraphs.isArray()) {
				continue;
			}
			int chunkIndex = 0;
			for (JsonNode paragraph : paragraphs) {
				String chunkId = "%s-p%04d".formatted(documentId, chunkIndex++);
				String content = paragraph.path("context").asText("");
				if (content.toLowerCase(Locale.ROOT).contains(normalizedQuery)) {
					count++;
					if (preview.size() < PREVIEW_LIMIT) {
						preview.add(new SearchPreview(chunkId, title, excerpt(content)));
					}
				}
			}
		}
		return new Snapshot(count, List.copyOf(preview));
	}

	private static String excerpt(String content) {
		return content.length() <= EXCERPT_LENGTH
				? content
				: content.substring(0, EXCERPT_LENGTH) + "…";
	}

	private static TimedSnapshot time(SearchOperation operation) throws IOException, SQLException {
		long started = System.nanoTime();
		Snapshot snapshot = operation.run();
		return new TimedSnapshot(snapshot, System.nanoTime() - started);
	}

	private static MethodResult toMethodResult(String method, List<Long> samples, Snapshot snapshot) {
		List<Long> sorted = new ArrayList<>(samples);
		Collections.sort(sorted);
		double average = samples.stream().mapToLong(Long::longValue).average().orElse(0) / 1_000.0;
		double median = sorted.size() % 2 == 0
				? (sorted.get(sorted.size() / 2 - 1) / 1_000.0 + sorted.get(sorted.size() / 2) / 1_000.0) / 2.0
				: sorted.get(sorted.size() / 2) / 1_000.0;
		List<Double> sampleMicros = samples.stream().map(nanos -> nanos / 1_000.0).toList();
		return new MethodResult(
				method,
				snapshot.matchCount(),
				average,
				median,
				sorted.getFirst() / 1_000.0,
				sorted.getLast() / 1_000.0,
				sampleMicros,
				snapshot.preview());
	}

	@FunctionalInterface
	private interface SearchOperation {
		Snapshot run() throws IOException, SQLException;
	}

	private record Snapshot(long matchCount, List<SearchPreview> preview) {
	}

	private record TimedSnapshot(Snapshot snapshot, long elapsedNanos) {
	}
}
