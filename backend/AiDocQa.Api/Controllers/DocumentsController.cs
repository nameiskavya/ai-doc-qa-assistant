using AiDocQa.Api.Models;
using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace AiDocQa.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class DocumentsController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;

    // Shared serializer options — camelCase for all worker calls
    private static readonly JsonSerializerOptions CamelCase = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public DocumentsController(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

    [HttpPost("upload")]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest("Uploaded file is empty.");

        using var content = new MultipartFormDataContent();
        await using var stream = file.OpenReadStream();
        using var fileContent = new StreamContent(stream);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue(file.ContentType);
        content.Add(fileContent, "file", file.FileName);

        var worker = _httpClientFactory.CreateClient("Worker");
        var response = await worker.PostAsync("/ingest", content, HttpContext.RequestAborted);
        var bytes = await response.Content.ReadAsByteArrayAsync();

        HttpContext.Response.ContentType = "application/json";
        return StatusCode((int)response.StatusCode, JsonDocument.Parse(bytes).RootElement);
    }

    [HttpPost("ask")]
    public async Task<IActionResult> Ask([FromBody] AskRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.DocumentId))
            return BadRequest("DocumentId is required.");
        if (string.IsNullOrWhiteSpace(request.Question))
            return BadRequest("Question is required.");

        var worker = _httpClientFactory.CreateClient("Worker");

        var payload = JsonSerializer.Serialize(request, CamelCase);

        var response = await worker.PostAsync(
            "/ask",
            new StringContent(payload, Encoding.UTF8, "application/json"),
            HttpContext.RequestAborted
        );

        var bytes = await response.Content.ReadAsByteArrayAsync();

        HttpContext.Response.ContentType = "application/json";
        return StatusCode((int)response.StatusCode, JsonDocument.Parse(bytes).RootElement);
    }

    [HttpPost("feedback")]
    public async Task<IActionResult> Feedback([FromBody] FeedbackRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.DocumentId))
            return BadRequest("DocumentId is required.");
        if (string.IsNullOrWhiteSpace(request.Rating))
            return BadRequest("Rating is required.");

        var worker = _httpClientFactory.CreateClient("Worker");

        // Was missing CamelCase here — this was the feedback bug
        var payload = JsonSerializer.Serialize(request, CamelCase);

        var response = await worker.PostAsync(
            "/feedback",
            new StringContent(payload, Encoding.UTF8, "application/json"),
            HttpContext.RequestAborted
        );

        var bytes = await response.Content.ReadAsByteArrayAsync();

        HttpContext.Response.ContentType = "application/json";
        return StatusCode((int)response.StatusCode, JsonDocument.Parse(bytes).RootElement);
    }
}