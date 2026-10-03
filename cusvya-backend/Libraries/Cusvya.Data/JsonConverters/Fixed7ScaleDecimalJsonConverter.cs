using System;
using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Scootr.Data.JsonConverters
{
    public sealed class Fixed7ScaleDecimalJsonConverter : JsonConverter<decimal>
    {
        public override decimal Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.Number)
            {
                return reader.GetDecimal();
            }

            if (reader.TokenType == JsonTokenType.String)
            {
                var value = reader.GetString();
                if (decimal.TryParse(value, NumberStyles.Any, CultureInfo.InvariantCulture, out var parsed))
                {
                    return parsed;
                }
            }

            throw new JsonException("Invalid decimal value.");
        }

        public override void Write(Utf8JsonWriter writer, decimal value, JsonSerializerOptions options)
        {
            writer.WriteRawValue(value.ToString("0.0000000", CultureInfo.InvariantCulture));
        }
    }
}
