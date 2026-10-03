using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cusvya.Api.Template.Controllers;

[ApiController]
[Authorize(Policy = "UserOrCustomer")]
[Route("api/dashboard")]
public sealed class DashboardController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new
        {
            title = "Cusvya Template Dashboard",
            customers = 12,
            users = 4,
            todaySignIns = 7
        });
    }
}

