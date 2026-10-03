package com.unus.one.controller;

import java.io.IOException;
import java.sql.SQLException;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.unus.one.dto.SearchBenchmarkResponse;
import com.unus.one.service.SearchBenchmarkService;

@RestController
@RequestMapping("/api/benchmark")
public class SearchBenchmarkController {
	private static final int MAX_RUNS = 100;
	private final SearchBenchmarkService benchmarkService;

	public SearchBenchmarkController(SearchBenchmarkService benchmarkService) {
		this.benchmarkService = benchmarkService;
	}

	@GetMapping("/compare")
	public SearchBenchmarkResponse compare(
			@RequestParam(name = "q") String query,
			@RequestParam(name = "runs", defaultValue = "10") int runs) {
		if (query.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "q must not be blank");
		}
		if (runs < 1 || runs > MAX_RUNS) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "runs must be between 1 and 100");
		}
		try {
			return benchmarkService.compare(query, runs);
		} catch (IOException | SQLException exception) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
					"Unable to read the configured demo dataset", exception);
		}
	}
}
