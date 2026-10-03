using Cusvya.Api.Template.Contracts.Users;
using Cusvya.Core.Template.Entities;
using Cusvya.Services.Template.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cusvya.Api.Template.Controllers;

[ApiController]
[Authorize(Policy = "UserOnly")]
[Route("api/users")]
public sealed class UsersController(IUserService userService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(List<UserResponse>), StatusCodes.Status200OK)]
    public async Task<List<UserResponse>> List(CancellationToken cancellationToken)
    {
        var users = await userService.ListAsync(cancellationToken);
        return users.Select(Map).ToList();
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(UserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Get(int id, CancellationToken cancellationToken)
    {
        var user = await userService.GetAsync(id, cancellationToken);
        return user is null ? NotFound() : Ok(Map(user));
    }

    [HttpPost]
    [ProducesResponseType(typeof(UserResponse), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] UserUpsertRequest request, CancellationToken cancellationToken)
    {
        var user = await userService.CreateAsync(new User
        {
            Name = request.Name,
            Email = request.Email,
            PhoneNumber = request.PhoneNumber,
            FirebaseUid = request.FirebaseUid,
            IsActive = request.IsActive
        }, cancellationToken);

        return CreatedAtAction(nameof(Get), new { id = user.Id }, Map(user));
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(UserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] UserUpsertRequest request, CancellationToken cancellationToken)
    {
        var updated = await userService.UpdateAsync(id, new User
        {
            Name = request.Name,
            Email = request.Email,
            PhoneNumber = request.PhoneNumber,
            FirebaseUid = request.FirebaseUid,
            IsActive = request.IsActive
        }, cancellationToken);

        return updated is null ? NotFound() : Ok(Map(updated));
    }

    private static UserResponse Map(User user) =>
        new(
            user.Id,
            user.Name,
            user.Email,
            user.PhoneNumber,
            user.FirebaseUid,
            user.IsActive,
            new DateTimeOffset(DateTime.SpecifyKind(user.CreatedAtUtc, DateTimeKind.Utc)),
            user.UpdatedAtUtc is null
                ? null
                : new DateTimeOffset(DateTime.SpecifyKind(user.UpdatedAtUtc.Value, DateTimeKind.Utc)));
}
