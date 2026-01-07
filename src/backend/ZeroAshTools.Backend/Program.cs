using System.Collections.Concurrent;
using System.Text.Json;
using System.Text.Json.Serialization;
using Mikibot.Crawler.Http.Bilibili;

var builder = WebApplication.CreateSlimBuilder(args);
builder.Services.AddSingleton<HttpClient>();
builder.Services.AddSingleton<BiliVideoCrawler>();

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.TypeInfoResolverChain.Insert(0, AppJsonSerializerContext.Default);
});

builder.Services.AddOpenApi();
builder.Services.AddCors(cors =>
{
    cors.AddPolicy("trust-sites", (policy) => policy
        .WithOrigins("https://tools.ayelet.cn", "https://tools.zeroash.cn", "http://localhost:5173"));
});
builder.Services.AddResponseCaching();
builder.Services.AddResponseCompression();

var app = builder.Build();
app.UseResponseCaching();
app.UseResponseCompression();

var cancellationToken = app.Lifetime.ApplicationStopping;
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
app.UseCors("trust-sites");
var crawler = app.Services.GetRequiredService<BiliVideoCrawler>();
var httpClient = app.Services.GetRequiredService<HttpClient>();
var bilibiliApi = app.MapGroup("/api/v1/bilibili");

var _cache = await ReadCache();
Dictionary<string, SemaphoreSlim> _locks = [];
var _lock = new SemaphoreSlim(1);

if (!Directory.Exists("data"))
{
    Directory.CreateDirectory("data");
}

bilibiliApi.MapGet("/cover/{bv}", async (string bv) =>
{
    try
    {
        return Results.Ok(await GetBvAsync(bv));
    }
    catch (Exception e)
    {
        Console.WriteLine(e);
        return Results.NotFound();
    }
}).RequireCors("trust-sites");

// periodic save caches to file
_ = IntervalFlushCacheAsync();

app.Run();

async ValueTask<T> BeginBvScopeAsync<T>(string bv, Func<ValueTask<T>> scope)
{
    await _lock.WaitAsync(cancellationToken);
    try
    {
        if (!_locks.TryGetValue(bv, out var bvLock))
            _locks.Add(bv, new SemaphoreSlim(1));
    }
    finally
    {
        _lock.Release();
    }

    await _locks[bv].WaitAsync(cancellationToken);
    try
    {
        return await scope();
    }
    finally
    {
        _locks[bv].Release();
    }
}

async ValueTask<VideoParseResult> GetBvFromBilibiliAsync(string bv)
{
    app.Logger.LogInformation("Loading video information form bilibili without cache: {BV}", bv);
    var info = await crawler.GetVideoInfo(bv, null, cancellationToken);
    var data = await httpClient.GetByteArrayAsync($"{info.CoverUrl}@300w_168h_1c.jpg", cancellationToken);
    var dataUri = $"data:image/jpeg;base64,{Convert.ToBase64String(data)}";
    return new VideoParseResult(
        info.Title,
        info.Owner.Name,
        dataUri,
        $"https://www.bilibili.com/video/{bv}");
        
}

async ValueTask<VideoParseResult> GetBvAsync(string bv)
{
    if (_cache.TryGetValue(bv, out var _result)) return _result;

    return await BeginBvScopeAsync(bv, async () =>
    {
        if (_cache.TryGetValue(bv, out var _result)) return _result;
        var result = await GetBvFromBilibiliAsync(bv);
        _cache.TryAdd(bv, result);
        return result;
    });
}


const string CacheFilePath = "data/cache.json";
const string CacheFileTempPath = "data/cache.json.1";
const string CacheFileBackPath = "data/cache.json.bak";

async Task IntervalFlushCacheAsync()
{
    while (!cancellationToken.IsCancellationRequested)
    {
        await Task.Delay(TimeSpan.FromSeconds(5));
        try
        {
            var data = JsonSerializer.SerializeToUtf8Bytes(_cache);
            if (data is not { Length: > 0}) continue;

            await File.WriteAllBytesAsync(CacheFileTempPath, data, cancellationToken);
            if (!File.Exists(CacheFilePath))
            {
                File.Copy(CacheFileTempPath, CacheFilePath);
                File.Delete(CacheFileTempPath);
            }
            else File.Replace(CacheFileTempPath, CacheFilePath, CacheFileBackPath);
        }
        catch (Exception e)
        {
            Console.WriteLine(e);
        }
    }
}

async ValueTask<ConcurrentDictionary<string, VideoParseResult>> ReadCache()
{
    if (!File.Exists(CacheFilePath))
    {
        return [];
    }
    await using var file = File.OpenRead(CacheFilePath);
    return await JsonSerializer.DeserializeAsync<ConcurrentDictionary<string, VideoParseResult>>(file) ?? [];
}

public record VideoParseResult(string Title, string Author, string Image, string Url);

[JsonSerializable(typeof(VideoParseResult[]))]
internal partial class AppJsonSerializerContext : JsonSerializerContext
{
}