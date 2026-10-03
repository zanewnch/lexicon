package com.unus.one;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@AutoConfigureMockMvc
@SpringBootTest
class SearchBenchmarkControllerTests {
	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;

	@Test
	void compareEndpointReturnsEquivalentMatchesAndTimingSamples() throws Exception {
		MvcResult result = mockMvc.perform(get("/api/benchmark/compare")
					.param("q", "Normandy")
					.param("runs", "2"))
				.andExpect(status().isOk())
				.andReturn();

		JsonNode response = objectMapper.readTree(result.getResponse().getContentAsString());
		JsonNode sqlite = response.path("sqlite");
		JsonNode jsonParser = response.path("jsonParser");

		assertEquals("Normandy", response.path("query").asText());
		assertEquals(2, response.path("runs").asInt());
		assertTrue(sqlite.path("matchCount").asLong() > 0);
		assertEquals(sqlite.path("matchCount").asLong(), jsonParser.path("matchCount").asLong());
		assertEquals(2, sqlite.path("samplesMicros").size());
		assertEquals(2, jsonParser.path("samplesMicros").size());
		assertEquals(sqlite.path("preview").path(0).path("chunkId").asText(),
				jsonParser.path("preview").path(0).path("chunkId").asText());
		assertFalse(response.path("methodology").asText().isBlank());
	}

	@Test
	void compareEndpointRejectsBlankQuery() throws Exception {
		mockMvc.perform(get("/api/benchmark/compare").param("q", " "))
				.andExpect(status().isBadRequest());
	}

	@Test
	void compareEndpointRejectsRunCountsOutsideAllowedRange() throws Exception {
		mockMvc.perform(get("/api/benchmark/compare")
					.param("q", "Normandy")
					.param("runs", "0"))
				.andExpect(status().isBadRequest());

		mockMvc.perform(get("/api/benchmark/compare")
					.param("q", "Normandy")
					.param("runs", "101"))
				.andExpect(status().isBadRequest());
	}
}
