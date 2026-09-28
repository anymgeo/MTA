namespace Mta.Api;

// External feed adapters return observations here, never CMS text or save timestamps.
public record LiveResortConditions(
    Guid ResortId, string Status = "unavailable", double? Temperature = null,
    string? WeatherCondition = null, double? SnowDepthCm = null, double? NewSnow24hCm = null,
    int? LiftsOpen = null, int? LiftsTotal = null, int? TrailsOpen = null, int? TrailsTotal = null,
    double? WindSpeedKmh = null, string? WindDirection = null, string? Visibility = null,
    string? OperatingFrom = null, string? OperatingTo = null, double? TopElevationM = null,
    DateTimeOffset? LastUpdatedAt = null);

public interface ILiveConditionsProvider
{
    bool IsActive { get; }
    Task<LiveResortConditions> GetAsync(Guid resortId, string slug, CancellationToken cancellationToken);
}

// Safe default until an authenticated external feed adapter is registered.
public sealed class UnavailableLiveConditionsProvider : ILiveConditionsProvider
{
    public bool IsActive => false;
    public Task<LiveResortConditions> GetAsync(Guid resortId, string slug, CancellationToken cancellationToken)
        => Task.FromResult(new LiveResortConditions(resortId));
}
