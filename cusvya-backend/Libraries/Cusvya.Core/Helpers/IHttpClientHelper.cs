using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace Scootr.Core.Helpers
{
   public  interface IHttpClientHelper<T>
    {

           Task<T> GetSingleItemRequest(string apiUrl, IDictionary<string, string> headers, CancellationToken token);
            Task<T> GetSingleItemRequest(string apiUrl, CancellationToken token = default(CancellationToken));
            Task<T[]> GetMultipleItemsRequest(string apiUrl, CancellationToken token = default(CancellationToken));
            Task<T> PostRequest(string apiUrl, T postObject, CancellationToken token = default(CancellationToken));
            Task<TResponse> PostRequestAsync<TResponse>(string apiUrl, object postObject, IDictionary<string, string> headers, CancellationToken cancellationToken = default);

            Task PutRequest(string apiUrl, T putObject, CancellationToken token = default(CancellationToken));
            Task DeleteRequest(string apiUrl, CancellationToken token = default(CancellationToken));
            Task<TResponse> GetRequestAsync<TResponse>(string apiUrl, IDictionary<string, string> headers, CancellationToken token = default);
            Task<TResponse> GetRequestAsync<TResponse>(string apiUrl, CancellationToken token = default);
        
    }
}
