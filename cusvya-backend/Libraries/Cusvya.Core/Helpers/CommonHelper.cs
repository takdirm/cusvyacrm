using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using Scootr.Core.Infrastructure;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace Scootr.Core.Helpers
{
    public static class CommonHelper
    {
        public static List<List<T>> Split<T>(this List<T> items, int sliceSize = 200)
        {
            List<List<T>> list = new List<List<T>>();
            for (int i = 0; i < items.Count; i += sliceSize)
                list.Add(items.GetRange(i, Math.Min(sliceSize, items.Count - i)));
            return list;
        }

        public static int? CalculateAge(DateOnly? dateOfBirth)
        {
            if (dateOfBirth == null)
                return null;

            var today = DateOnly.FromDateTime(DateTime.Today);
            int age = today.Year - dateOfBirth.Value.Year;

            if (dateOfBirth.Value > today.AddYears(-age))
                age--;

            return age;
        }

        // Generates a 10-character alphanumeric string for ReferenceId
        public static string GenerateReferenceId()
        {
            const string chars = "0123456789";
            var random = new Random();
            var buffer = new char[10];
            for (int i = 0; i < buffer.Length; i++)
            {
                buffer[i] = chars[random.Next(chars.Length)];
            }
            return new string(buffer);
        }
        public static string ToTimeAgo(this DateTime targetDate)
        {
            TimeSpan timeSince = DateTime.Now.Subtract(targetDate);

            if (timeSince.TotalDays < 1) // Less than a day ago
            {
                if (timeSince.TotalHours < 1) // Less than an hour ago
                {
                    if (timeSince.TotalMinutes < 1) // Less than a minute ago
                    {
                        return "just now";
                    }
                    return $"{Math.Floor(timeSince.TotalMinutes)} minutes ago";
                }
                return $"{Math.Floor(timeSince.TotalHours)} hours ago";
            }
            else if (timeSince.TotalDays < 7) // Less than a week ago
            {
                return $"{Math.Floor(timeSince.TotalDays)} days ago";
            }
            else if (timeSince.TotalDays < 30) // Less than a month ago (approx. 4 weeks)
            {
                int weeks = (int)Math.Floor(timeSince.TotalDays / 7);
                return $"{weeks} {(weeks == 1 ? "week" : "weeks")} ago";
            }
            else if (timeSince.TotalDays < 365) // Less than a year ago
            {
                int months = (int)Math.Floor(timeSince.TotalDays / 30.436875); // Average days in a month
                return $"{months} {(months == 1 ? "month" : "months")} ago";
            }
            else // More than a year ago
            {
                int years = (int)Math.Floor(timeSince.TotalDays / 365.25); // Average days in a year (including leap years)
                return $"{years} {(years == 1 ? "year" : "years")} ago";
            }
        }

        public static string GetTimeAgo(DateTime createdAt)
        {
            throw new NotImplementedException();
        }

        public static string GenerateAPIKey()
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            var random = new Random();
            var buffer = new char[32];
            for (int i = 0; i < buffer.Length; i++)
            {
                buffer[i] = chars[random.Next(chars.Length)];
            }
            return new string(buffer);
        }

        public static string GenerateAPISecret()
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{}|;:,.<>?";
            var buffer = new char[64];
            using (var rng = System.Security.Cryptography.RandomNumberGenerator.Create())
            {
                var data = new byte[buffer.Length];
                rng.GetBytes(data);
                for (int i = 0; i < buffer.Length; i++)
                {
                    buffer[i] = chars[data[i] % chars.Length];
                }
            }
            return new string(buffer);
        }

        /// <summary>
        /// Converts a value to a destination type.
        /// </summary>
        /// <param name="value">The value to convert.</param>
        /// <param name="destinationType">The type to convert the value to.</param>
        /// <param name="culture">Culture</param>
        /// <returns>The converted value.</returns>
        public static object To(object value, Type destinationType, CultureInfo culture)
        {
            if (value == null)
                return null;

            var sourceType = value.GetType();

            var destinationConverter = TypeDescriptor.GetConverter(destinationType);
            if (destinationConverter.CanConvertFrom(value.GetType()))
                return destinationConverter.ConvertFrom(null, culture, value);

            var sourceConverter = TypeDescriptor.GetConverter(sourceType);
            if (sourceConverter.CanConvertTo(destinationType))
                return sourceConverter.ConvertTo(null, culture, value, destinationType);

            if (destinationType.IsEnum && value is int)
                return Enum.ToObject(destinationType, (int)value);

            if (!destinationType.IsInstanceOfType(value))
                return Convert.ChangeType(value, destinationType, culture);

            return value;
        }


        public static T To<T>(object value)
        {
            //return (T)Convert.ChangeType(value, typeof(T), CultureInfo.InvariantCulture);
            return (T)To(value, typeof(T), CultureInfo.InvariantCulture);
        }

        public static ICusvyaFileProvider DefaultFileProvider { get; set; }


        // Helper to convert Unix timestamp to DateTime? (UTC)
        public static DateTime? ToDateTime(long? unixTime)
        {
            if (!unixTime.HasValue || unixTime.Value == 0)
                return null;

            // If the value is too large, assume it's in milliseconds and convert to seconds
            long value = unixTime.Value;
            if (value > 253402300799) // max valid seconds for FromUnixTimeSeconds
                value = value / 1000;

            return DateTimeOffset.FromUnixTimeSeconds(value).UtcDateTime;
        }

    }
}
