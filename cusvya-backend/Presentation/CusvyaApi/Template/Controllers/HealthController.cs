using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cusvya.Api.Template.Controllers;

[ApiController]
[Route("api/health")]
public sealed class HealthController : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public IActionResult Get()
    {
        return Ok(new
        {
            status = "ok",
            utc = DateTime.UtcNow
        });
    }
}

