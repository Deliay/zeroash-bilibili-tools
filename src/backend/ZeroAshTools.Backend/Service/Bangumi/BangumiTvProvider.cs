using BangumiApi;
using BangumiApi.Models;
using BangumiApi.V0.Search.Subjects;
using ZeroAshTools.Backend.Data;

namespace ZeroAshTools.Backend.Service.Bangumi;

public class BangumiTvProvider(ApiClient client)
{
    private static string GetName(Subject subject)
    {
        if (subject.Name is not null && subject.NameCn is not null)
        {
            return $"{subject.NameCn} ({subject.Name})";
        }

        return subject.Name ?? subject.NameCn ?? $"{subject.Id}";
    }
    
    public async ValueTask<IEnumerable<RateItem>> Search(string term, CancellationToken cancellationToken = default)
    {
        var result = await client.V0.Search.Subjects.PostAsync(new SubjectsPostRequestBody()
        {
            Sort = SubjectsPostRequestBody_sort.Heat,
            Keyword = term,
            Filter = new SubjectsPostRequestBody_filter()
            {
                Type = [2],
                Nsfw = false,
            }
        }, cancellationToken: cancellationToken);

        return (result?.Data ?? []).Select((s) => new RateItem(
            $"bangumi.tv/subject/{s.Id}",
            GetName(s),
            "",
            s.Images?.Common ?? "",
            $"https://bangumi.tv/subject/{s.Id}",
            "bangumi-subject"));
    }
}
