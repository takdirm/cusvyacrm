using Microsoft.AspNetCore.Mvc;
using Scootr.Core.Domain.Settings;
using Scootr.Data.Services.Settings;

namespace ScootrApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HealthController : ControllerBase
    {
        #region Fields
        ApplicationSettings _applicationSettings;

        #endregion

        public HealthController(ApplicationSettings applicationSettings)
        {
            _applicationSettings = applicationSettings;
        }
        [HttpGet("alive")]
        public IActionResult GetAlive()
        {
            var appVersion = _applicationSettings.Version;
            return Ok(new { status = $"I am alive {appVersion}" });
        }
    }
}