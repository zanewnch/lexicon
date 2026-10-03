package com.unus.one.dto;

import java.util.List;

public record SearchBenchmarkResponse(
		String query,
		int runs,
		String methodology,
		MethodResult sqlite,
		MethodResult jsonParser) {

	public record MethodResult(
			String method,
			long matchCount,
			double averageMicros,
			double medianMicros,
			double minMicros,
			double maxMicros,
			List<Double> samplesMicros,
			List<SearchPreview> preview) {
	}

	public record SearchPreview(String chunkId, String documentTitle, String excerpt) {
	}
}
