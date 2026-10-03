using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;


namespace Scootr.Core.Helpers
{

    public class HttpClientHelper<T> : IHttpClientHelper<T>
    {
        private static readonly HttpClient Client = new HttpClient(new SocketsHttpHandler
        {
            PooledConnectionLifetime = TimeSpan.FromMinutes(5)
        });
        /// <summary>
        /// For getting a single item from a web api uaing GET
        /// </summary>
        /// <param name="apiUrl">Added to the base address to make the full url of the 
        ///     api get method, e.g. "products/1" to get a product with an id of 1</param>
        /// <param name="cancellationToken"></param>
        /// <returns>The item requested</returns>
        public async Task<T> GetSingleItemRequest(string apiUrl, CancellationToken cancellationToken)
        {
            var result = default(T);
            var response = await Client.GetAsync(apiUrl, cancellationToken).ConfigureAwait(false);
            if (response.IsSuccessStatusCode)
            {
                await response.Content.ReadAsStringAsync().ContinueWith(x =>
                {
                    if (typeof(T).Namespace != "System")
                    {
                        result = JsonConvert.DeserializeObject<T>(x?.Result);
                    }
                    else result = (T)Convert.ChangeType(x?.Result, typeof(T));
                }, cancellationToken);
            }
            else
            {
                var content = await response.Content.ReadAsStringAsync();
                response.Content?.Dispose();
                throw new HttpRequestException($"{response.StatusCode}:{content}");
            }
            return result;
        }

        public async Task<T> GetSingleItemRequest(string apiUrl, IDictionary<string, string> headers, CancellationToken cancellationToken)
        {
            T result = default(T);

            using (var request = new HttpRequestMessage(HttpMethod.Get, apiUrl))
            {
                if (headers != null)
                {
                    foreach (var header in headers)
                    {
                        request.Headers.Add(header.Key, header.Value);
                    }
                }

                var response = await Client.SendAsync(request, cancellationToken).ConfigureAwait(false);
                if (response.IsSuccessStatusCode)
                {
                    await response.Content.ReadAsStringAsync().ContinueWith(x =>
                    {
                        if (typeof(T).Namespace != "System")
                        {
                            result = JsonConvert.DeserializeObject<T>(x?.Result);
                        }
                        else result = (T)Convert.ChangeType(x?.Result, typeof(T));
                    }, cancellationToken);
                }
                else
                {
                    var content = await response.Content.ReadAsStringAsync();
                    response.Content?.Dispose();
                    throw new HttpRequestException($"{response.StatusCode}:{content}");
                }
            }
            return result;
        }

        /// <summary>
        /// For getting multiple (or all) items from a web api using GET
        /// </summary>
        /// <param name="apiUrl">Added to the base address to make the full url of the 
        ///     api get method, e.g. "products?page=1" to get page 1 of the products</param>
        /// <param name="cancellationToken"></param>
        /// <returns>The items requested</returns>
        public async Task<T[]> GetMultipleItemsRequest(string apiUrl, CancellationToken cancellationToken)
        {
            T[] result = null;
            var response = await Client.GetAsync(apiUrl, cancellationToken).ConfigureAwait(false);
            if (response.IsSuccessStatusCode)
            {
                await response.Content.ReadAsStringAsync().ContinueWith((Task<string> x) =>
                {
                    result = JsonConvert.DeserializeObject<T[]>(x.Result);
                }, cancellationToken);
            }
            else
            {
                var content = await response.Content.ReadAsStringAsync();
                response.Content?.Dispose();
                throw new HttpRequestException($"{response.StatusCode}:{content}");
            }
            return result;
        }

        /// <summary>
        /// For creating a new item over a web api using POST
        /// </summary>
        /// <param name="apiUrl">Added to the base address to make the full url of the 
        ///     api post method, e.g. "products" to add products</param>
        /// <param name="postObject">The object to be created</param>
        /// <param name="cancellationToken"></param>
        /// <returns>The item created</returns>
        public async Task<T> PostRequest(string apiUrl, T postObject, CancellationToken cancellationToken)
        {
            T result = default(T);

            var httpContent = new StringContent(
                System.Text.Json.JsonSerializer.Serialize(postObject),
                Encoding.UTF8,
                "application/json");
           
            var response = await Client.PostAsync(apiUrl,httpContent, cancellationToken).ConfigureAwait(false);
            if (response.IsSuccessStatusCode)
            {
                await response.Content.ReadAsStringAsync().ContinueWith((Task<string> x) =>
                {
                    result = JsonConvert.DeserializeObject<T>(x.Result);
                }, cancellationToken);
            }
            else
            {
                var content = await response.Content.ReadAsStringAsync();
                response.Content?.Dispose();
                throw new HttpRequestException($"{response.StatusCode}:{content}");
            }
            return result;
        }

        public async Task<TResponse> PostRequestAsync<TResponse>(string apiUrl, object postObject, IDictionary<string, string> headers, CancellationToken cancellationToken = default)
        {
            TResponse result = default;

            var httpContent = new StringContent(
            System.Text.Json.JsonSerializer.Serialize(
                postObject,
                new System.Text.Json.JsonSerializerOptions { PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase }
            ),
            Encoding.UTF8,
            "application/json");

            using (var request = new HttpRequestMessage(HttpMethod.Post, apiUrl))
            {
                request.Content = httpContent;

                if (headers != null)
                {
                    foreach (var header in headers)
                    {
                        request.Headers.Add(header.Key, header.Value);
                    }
                }

                var response = await Client.SendAsync(request, cancellationToken).ConfigureAwait(true);
                if (response.IsSuccessStatusCode)
                {
                    var responseString = await response.Content.ReadAsStringAsync();
                    result = JsonConvert.DeserializeObject<TResponse>(responseString);
                }
                else
                {
                    var content = await response.Content.ReadAsStringAsync();
                    response.Content?.Dispose();
                    throw new HttpRequestException($"{response.StatusCode}:{content}");
                }
            }
            return result;
        }

        /// <summary>
        /// For updating an existing item over a web api using PUT
        /// </summary>
        /// <param name="apiUrl">Added to the base address to make the full url of the 
        ///     api put method, e.g. "products/3" to update product with id of 3</param>
        /// <param name="putObject">The object to be edited</param>
        /// <param name="cancellationToken"></param>
        public async Task PutRequest(string apiUrl, T putObject, CancellationToken cancellationToken)
        {
            var httpContent = new StringContent(
              System.Text.Json.JsonSerializer.Serialize(putObject),
              Encoding.UTF8,
              "application/json");

            var response = await Client.PutAsync(apiUrl, httpContent, cancellationToken).ConfigureAwait(false);
            if (!response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                response.Content?.Dispose();
                throw new HttpRequestException($"{response.StatusCode}:{content}");
            }
        }

        /// <summary>
        /// For deleting an existing item over a web api using DELETE
        /// </summary>
        /// <param name="apiUrl">Added to the base address to make the full url of the 
        ///     api delete method, e.g. "products/3" to delete product with id of 3</param>
        /// <param name="cancellationToken"></param>
        public async Task DeleteRequest(string apiUrl, CancellationToken cancellationToken)
        {
            var response = await Client.DeleteAsync(apiUrl, cancellationToken).ConfigureAwait(false);
            if (!response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                response.Content?.Dispose();
                throw new HttpRequestException($"{response.StatusCode}:{content}");
            }
        }

        public async Task<TResponse> GetRequestAsync<TResponse>(string apiUrl, IDictionary<string, string> headers, CancellationToken cancellationToken = default)
        {
            TResponse result = default;

            using (var request = new HttpRequestMessage(HttpMethod.Get, apiUrl))
            {
                if (headers != null)
                {
                    foreach (var header in headers)
                    {
                        request.Headers.Add(header.Key, header.Value);
                    }
                }

                var response = await Client.SendAsync(request, cancellationToken).ConfigureAwait(true);
                if (response.IsSuccessStatusCode)
                {
                    var responseString = await response.Content.ReadAsStringAsync();
                    result = JsonConvert.DeserializeObject<TResponse>(responseString);
                }
                else
                {
                    var content = await response.Content.ReadAsStringAsync();
                    response.Content?.Dispose();
                    throw new HttpRequestException($"{response.StatusCode}:{content}");
                }
            }
            return result;
        }

        public async Task<TResponse> GetRequestAsync<TResponse>(string apiUrl, CancellationToken token = default)
        {
            TResponse result = default;

            using (var request = new HttpRequestMessage(HttpMethod.Get, apiUrl))
            {
                var response = await Client.SendAsync(request, token).ConfigureAwait(true);
                if (response.IsSuccessStatusCode)
                {
                    var responseString = await response.Content.ReadAsStringAsync();
                    result = JsonConvert.DeserializeObject<TResponse>(responseString);
                }
                else
                {
                    var content = await response.Content.ReadAsStringAsync();
                    response.Content?.Dispose();
                    throw new HttpRequestException($"{response.StatusCode}:{content}");
                }
            }
            return result;
        }
    }
}