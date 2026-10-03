using Cusvya.Api.Template.Contracts.Settings;
using Cusvya.Core.Template.Entities;
using Cusvya.Services.Template.Settings;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cusvya.Api.Template.Controllers;

[ApiController]
[Authorize(Policy = "UserOnly")]
[Route("api/settings")]
public sealed class SettingsController(ISettingService settingService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(List<SettingResponse>), StatusCodes.Status200OK)]
    public async Task<List<SettingResponse>> List(CancellationToken cancellationToken)
    {
        var settings = await settingService.ListAsync(cancellationToken);
        return settings.Select(Map).ToList();
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(SettingResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Get(int id, CancellationToken cancellationToken)
    {
        var setting = await settingService.GetAsync(id, cancellationToken);
        return setting is null ? NotFound() : Ok(Map(setting));
    }

    [HttpPost]
    [ProducesResponseType(typeof(SettingResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Upsert([FromBody] SettingUpsertRequest request, CancellationToken cancellationToken)
    {
        var updated = await settingService.UpsertAsync(new Setting
        {
            Key = request.Key,
            Value = request.Value,
            Description = request.Description
        }, cancellationToken);

        return Ok(Map(updated));
    }

    private static SettingResponse Map(Setting setting) =>
        new(
            setting.Id,
            setting.Key,
            setting.Value,
            setting.Description,
            new DateTimeOffset(DateTime.SpecifyKind(setting.CreatedAtUtc, DateTimeKind.Utc)),
            setting.UpdatedAtUtc is null
                ? null
                : new DateTimeOffset(DateTime.SpecifyKind(setting.UpdatedAtUtc.Value, DateTimeKind.Utc)));
}
