 // CRCUtil.cs
namespace GprsServer
{
    public static class CRCUtil
    {
        public static ushort CRCITU(byte[] data, int start, int length)
        {
            ushort crc = 0xFFFF;
            int end = start + length;

            for (int i = start; i < end; i++)
            {
                crc ^= data[i];
                for (int bit = 0; bit < 8; bit++)
                {
                    crc = (crc & 0x0001) != 0
                        ? (ushort)((crc >> 1) ^ 0x8408)
                        : (ushort)(crc >> 1);
                }
            }

            return (ushort)~crc;
        }
    }
}
