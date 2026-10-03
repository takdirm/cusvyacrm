
using System;
using System.Collections.Generic;
using System.Linq;
using OfficeOpenXml;
namespace Scootr.Core
{
   public class ReportParams
    {

        public string ReportName { get; set; }
        /// <summary>
        /// Get or set the SheetName
        /// </summary>
        public string SheetName { get; set; }

       
        /// <summary>
        /// Get or set the Excel Package
        /// </summary>
        public ExcelPackage Ep { get; set; }

        /// <summary>
        /// Get or set the Param1
        /// </summary>
        public Dictionary<string,string>  Param1 { get; set; }

      

        /// <summary>
        /// Get or set the List of Columns
        /// </summary>
        public List<string> ColumnNames { get; set; }

        
    }
}
