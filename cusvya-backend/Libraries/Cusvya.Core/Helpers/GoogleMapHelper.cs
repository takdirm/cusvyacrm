using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;

namespace Scootr.Core.Helpers
{
    //var helper = new GoogleMapHelper("YOUR_API_KEY");
    //var addresses = await helper.GetSearchableAddressesAsync("Bangalore MG Road");
    //var(distance, duration) = await helper.GetDistanceAsync("Bangalore MG Road", "Bangalore Airport");
    //var(distance2, duration2) = await helper.GetDistanceByCoordinatesAsync(12.9716, 77.5946, 13.1986, 77.7066);
    public class GoogleMapHelper : IDisposable
    {
        private readonly string _apiKey;
        private readonly HttpClient _httpClient;

        public GoogleMapHelper(string apiKey)
        {
            _apiKey = apiKey;
            _httpClient = new HttpClient();
        }

        // 1. Get address suggestions using Google Places Autocomplete API
        /// <summary>
        /// helper.GetSearchableAddressesAsync("Bangalore MG Road")
        /// </summary>
        /// <param name="input"></param>
        /// <param name="country"></param>
        /// <returns></returns>
        public async Task<List<string>> GetSearchableAddressesAsync(string input, string country = "in")
        {
            var url = $"https://maps.googleapis.com/maps/api/place/autocomplete/json?input={Uri.EscapeDataString(input)}&types=address&components=country:{country}&key={_apiKey}";
            var response = await _httpClient.GetStringAsync(url);
            using var doc = JsonDocument.Parse(response);

            var addresses = new List<string>();
            if (doc.RootElement.TryGetProperty("predictions", out var predictions))
            {
                foreach (var prediction in predictions.EnumerateArray())
                {
                    if (prediction.TryGetProperty("description", out var desc))
                        addresses.Add(desc.GetString());
                }
            }
            return addresses;
        }

        // 2. Get distance and duration between two locations using Google Distance Matrix API

        /// <summary>
        ///  helper.GetDistanceAsync("Bangalore MG Road", "Bangalore Airport");
        /// </summary>
        /// <param name="origin"></param>
        /// <param name="destination"></param>
        /// <returns></returns>
        /// <exception cref="Exception"></exception>
        public async Task<(double distanceMeters, double durationSeconds)> GetDistanceAsync(string origin, string destination)
        {
            var url = $"https://maps.googleapis.com/maps/api/distancematrix/json?origins={Uri.EscapeDataString(origin)}&destinations={Uri.EscapeDataString(destination)}&key={_apiKey}";
            var response = await _httpClient.GetStringAsync(url);
            using var doc = JsonDocument.Parse(response);

            var rows = doc.RootElement.GetProperty("rows");
            if (rows.GetArrayLength() > 0)
            {
                var elements = rows[0].GetProperty("elements");
                if (elements.GetArrayLength() > 0)
                {
                    var element = elements[0];
                    if (element.GetProperty("status").GetString() == "OK")
                    {
                        var distance = element.GetProperty("distance").GetProperty("value").GetDouble();
                        var duration = element.GetProperty("duration").GetProperty("value").GetDouble();
                        return (distance, duration);
                    }
                }
            }
            throw new Exception("Unable to calculate distance.");
        }

        // 3. Get distance and duration using coordinates
        /// <summary>
        /// helper.GetDistanceByCoordinatesAsync(12.9716, 77.5946, 13.1986, 77.7066)
        /// </summary>
        /// <param name="originLat"></param>
        /// <param name="originLng"></param>
        /// <param name="destLat"></param>
        /// <param name="destLng"></param>
        /// <returns></returns>
        /// <exception cref="Exception"></exception>
        public async Task<(double distanceMeters, double durationSeconds)> GetDistanceByCoordinatesAsync(
            double originLat, double originLng,
            double destLat, double destLng)
        {
            var origin = $"{originLat},{originLng}";
            var destination = $"{destLat},{destLng}";
            var url = $"https://maps.googleapis.com/maps/api/distancematrix/json?origins={origin}&destinations={destination}&key={_apiKey}";
            var response = await _httpClient.GetStringAsync(url);
            using var doc = JsonDocument.Parse(response);

            var rows = doc.RootElement.GetProperty("rows");
            if (rows.GetArrayLength() > 0)
            {
                var elements = rows[0].GetProperty("elements");
                if (elements.GetArrayLength() > 0)
                {
                    var element = elements[0];
                    if (element.GetProperty("status").GetString() == "OK")
                    {
                        var distance = element.GetProperty("distance").GetProperty("value").GetDouble();
                        var duration = element.GetProperty("duration").GetProperty("value").GetDouble();
                        return (distance, duration);
                    }
                }
            }
            throw new Exception("Unable to calculate distance.");
        }

        public void Dispose()
        {
            _httpClient?.Dispose();
        }
    }
}
