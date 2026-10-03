using DocumentFormat.OpenXml.Bibliography;
using DocumentFormat.OpenXml.Drawing;
using DocumentFormat.OpenXml.Drawing.Diagrams;
using DocumentFormat.OpenXml.Vml;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Threading.Tasks;

namespace Scootr.Core.Helpers
{
    
    public  class CertHelper
    {
      
        public static X509Certificate2 GetCertificate(string subjectName, StoreName storeName)
        {
            X509Store store = new X509Store(storeName, StoreLocation.LocalMachine);
            try
            {

                store.Open(OpenFlags.ReadOnly | OpenFlags.OpenExistingOnly);
                X509Certificate2Collection collection = (X509Certificate2Collection)store.Certificates;
                X509Certificate2Collection currentCerts = collection.Find(X509FindType.FindByTimeValid, DateTime.Now, false);
                X509Certificate2Collection signingCert = currentCerts.Find(X509FindType.FindBySubjectDistinguishedName, subjectName, false);
                if (signingCert.Count == 0)
                    return null;
                var cert = signingCert.OrderByDescending(i => i.NotAfter).FirstOrDefault();
                return cert;
            }
            catch (Exception)
            {

                throw;
            }
            finally
            {
                store.Close();
            }
        }


        public static X509Certificate2 GetCertificateFromPfxFile(string CertPath, string CertPassword)
        {
            try
            {
                X509Certificate2Collection collection = new X509Certificate2Collection();
                collection.Import(CertPath, CertPassword, X509KeyStorageFlags.PersistKeySet);
                return collection.FirstOrDefault();
               
            }
            catch (Exception)
            {

                throw;
            }
            finally
            {
               
            }
        }

        public static (X509Certificate2,string) CheckAndGetAvailableCertficate(string subjectName, string pfxPassword)
        {
            X509Certificate2 x509Certificate2 = null;
            string message = null;
            string certDir = AppContext.BaseDirectory + "conf" + System.IO.Path.DirectorySeparatorChar;
            try
            {

                var pemFile = GetLatestFile(certDir, "*.pem");
                if (pemFile != null)
                {
                    var keyFile = GetLatestFile(certDir, "*.key");
                    if (keyFile != null)
                    {
                        x509Certificate2 = X509Certificate2.CreateFromPemFile(pemFile.FullName,keyFile.FullName);
                        message = $"Using the Pem : {pemFile.FullName} and Key : {keyFile.FullName} files";
                       

                    }

                }

                if (x509Certificate2 == null)
                {
                    var pfxFile = GetLatestFile(certDir, "*.pfx");
                    if (pfxFile != null)
                    {
                        x509Certificate2 = GetCertificateFromPfxFile(pfxFile.FullName, pfxPassword);
                        message = $"Using the pfx  file : {pfxFile.FullName}";
                    }

                }

                if (x509Certificate2 == null)
                {

                    x509Certificate2 = GetCertificate($"CN={subjectName}", StoreName.My); // FindMatchingCertificateBySubject(CertificateSubjectName);
                    if (x509Certificate2 != null)
                    {
                        message = $"Using the Certificate from the Personal store with subject Name {subjectName}";
                       
                    }
                    else
                    {
                        x509Certificate2 = GetCertificate($"CN={subjectName}", StoreName.Root);
                        if (x509Certificate2 != null)
                        {
                            message = $"Using the Certificate from the Root store with subject Name {subjectName}";
                        }
                    }

                }

                if (x509Certificate2 == null)
                {
                    message = "Error:No Server Certificate found";
                }
                    

                return (x509Certificate2,message);
               

            }
            catch (Exception)
            {

                throw;
            }
            finally
            {

            }
        }

        private static FileInfo GetLatestFile(string directory, string pattern)
        {
           
            var dirInfo = new DirectoryInfo(directory);
            var file = (from f in dirInfo.GetFiles(pattern) orderby f.LastWriteTime descending select f).FirstOrDefault();
            return file;

        }
    }
}
