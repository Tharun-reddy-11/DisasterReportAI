package com.disasterreportai.api;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiValidationHandler {
  @ExceptionHandler(MethodArgumentNotValidException.class)
  ResponseEntity<Map<String, String>> invalidRequest(MethodArgumentNotValidException exception) {
    String field = exception.getBindingResult().getFieldErrors().stream()
        .findFirst().map(error -> error.getField()).orElse("field");
    return ResponseEntity.badRequest().body(Map.of("message", "Please provide a valid " + field + "."));
  }
}
