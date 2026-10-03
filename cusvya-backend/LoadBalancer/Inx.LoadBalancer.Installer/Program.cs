using Inx.Net.Deploy.Core;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Inx.Comms.Core.Configuration;
using Microsoft.Extensions.Configuration;
using Inx.Net.Deploy.Installer;
using Inx.Comms.Core.ClientAPI;
using Inx.Comms.Services.ServerServices;
using Inx.Net.Deploy.Installer.Common;
using Inx.Comms.Data;


namespace Inx.Net.Deploy.MsiInstaller
{
    class Program
    {

       


        static void Main(string[] args)
        {


            try
            {
                string AppSettingsFilePath = AppContext.BaseDirectory + "conf" + Path.DirectorySeparatorChar + "appsettings.json";
                IConfiguration configuration = new ConfigurationBuilder().AddUserSecrets<Program>().AddJsonFile(AppSettingsFilePath, true, true).Build();

                ServiceCollection serviceCollection = new ServiceCollection();

                ConfigureServices(serviceCollection, configuration);
                serviceCollection
               .AddLogging(configure =>
               {

                   configure.ClearProviders();
                   configure.AddLog4Net("log4net.installer.config");
               });

                var serviceProvider = serviceCollection.BuildServiceProvider();
                var app = serviceProvider.GetService<Inx.Net.Deploy.Installer.App>();
               
                
                app.Run(args);

                
            }
            catch (Exception ex)
            {
                Console.WriteLine(ExceptionExtensions.ToMessageAndCompleteStacktrace(ex));
                throw;
            }
            finally
            {
                Console.WriteLine(AppContext.BaseDirectory);
               
            }

        }

        static void ConfigureServices(ServiceCollection serviceCollection, IConfiguration configuration)
        {
           

            var appSettings = CommonHelper.ConfigurationAppSettings(configuration);

            ApiHelper.RequestTimeoutInMinutes = appSettings.GetConfig<CommsConfig>().RequestApiTimeoutInMins;
            ApiHelper.WebApiUri = appSettings.GetConfig<UriConfig>().WebApiUri;
            serviceCollection.AddSingleton(appSettings);
            CacheStaticInstance.AppSettings = appSettings;
            serviceCollection.AddSingleton<ICentralApiClient, CentralApiClient>();
            serviceCollection.AddSingleton<ICommonService, CommonService>();
            serviceCollection.AddSingleton<IDeploymentService, DeploymentService>();
           
            serviceCollection.AddSingleton<Inx.Net.Deploy.Installer.App>();

        }

    }
}
