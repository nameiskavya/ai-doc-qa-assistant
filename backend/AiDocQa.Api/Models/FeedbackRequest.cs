using System.Text.Json.Serialization;

namespace AiDocQa.Api.Models;

public sealed record FeedbackRequest(
    [property: JsonPropertyName("documentId")] string DocumentId,
    [property: JsonPropertyName("question")] string Question,
    [property: JsonPropertyName("answer")] string Answer,
    [property: JsonPropertyName("rating")] string Rating
);