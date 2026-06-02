using System.Text.Json.Serialization;

namespace AiDocQa.Api.Models;

public sealed record AskRequest(
    [property: JsonPropertyName("documentId")] string DocumentId,
    [property: JsonPropertyName("question")] string Question,
    [property: JsonPropertyName("topK")] int TopK = 5
);