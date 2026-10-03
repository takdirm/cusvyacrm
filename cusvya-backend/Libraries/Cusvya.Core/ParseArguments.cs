using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Scootr.Core
{
    public class ParseArguments
    {
        public static Dictionary<string, string> ParseInputArguments(string[] arguments)
        {
            Dictionary<string, string> dictionaryitems = new Dictionary<string, string>();


            foreach (string val in arguments)
            {
                string[] inst = val.Split(new Char[] { '=' }, 2);
                dictionaryitems.Add(inst[0].ToLower(), inst[1]);
            }

            return dictionaryitems;
        }
    }
}
