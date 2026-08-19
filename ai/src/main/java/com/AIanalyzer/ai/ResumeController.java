package com.AIanalyzer.ai;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*") // testing ke liye, baad mein specific origin daalna
public class ResumeController {

    @Value("${gemini.api.key}")
    private String apiKey;

    @PostMapping("/analyze")
    public String analyzeResume(
            @RequestParam("resume") MultipartFile resumeFile,
            @RequestParam("jobDescription") String jobDescription) throws Exception {

        // Step 1: PDF se text nikaalo
        String resumeText;
        try (PDDocument document = PDDocument.load(resumeFile.getInputStream())) {
            PDFTextStripper stripper = new PDFTextStripper();
            resumeText = stripper.getText(document);
        }

        // Step 2: Gemini ko prompt banao
        String prompt = "Compare this resume with the job description. "
                + "Give an ATS match score out of 100, list missing keywords, "
                + "and suggest improvements.\n\n"
                + "Resume:\n" + resumeText + "\n\n"
                + "Job Description:\n" + jobDescription;

        // Step 3: Gemini API call karo
        String geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new HashMap<>();
        List<Map<String, Object>> contents = new ArrayList<>();
        Map<String, Object> content = new HashMap<>();
        List<Map<String, String>> parts = new ArrayList<>();
        Map<String, String> part = new HashMap<>();
        part.put("text", prompt);
        parts.add(part);
        content.put("parts", parts);
        contents.add(content);
        body.put("contents", contents);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(geminiUrl, request, String.class);

        return response.getBody();
    }
}