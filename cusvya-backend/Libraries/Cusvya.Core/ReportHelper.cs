using System.Collections.Generic;
using OfficeOpenXml;
using System.IO;
using System;
using System.Drawing;
using System.Configuration;
using Newtonsoft.Json;
using OfficeOpenXml.Style;
using System.Security.Policy;

namespace Scootr.Core
{
    public class ReportHelper
    {
        /// <summary>
        /// Will Generate the Excel Report and save it in excelfile (temp) location.
        /// </summary>
        /// <param name="excelFile"></param>
        /// <param name="sheetName"></param>
        /// <param name="columnNames"></param>
        /// <param name="columnValues"></param>
        public static byte[] GetExcelUsingListString(List<string> columnValues, ReportParams reportParams)
        {
            int startRowIndex = 7;
            if (reportParams.Param1 != null)
            {
                startRowIndex = startRowIndex + reportParams.Param1.Count;
            }
            int rowIndex = startRowIndex;
            var wb = reportParams.Ep.Workbook;
            var ws = wb.Worksheets.Add(reportParams.SheetName);
           // ws.Cells.Style.Font.SetFromFont(font);
            ws = SetReportHeaders(ws, reportParams);
            int i = 1;
            foreach (var col in reportParams.ColumnNames)
            {
                ws.Cells[rowIndex, i].Value = col.ToUpper();
                i = i + 1;
            }

            // headers style
            using (var cells = ws.Cells[rowIndex, 1, rowIndex, i - 1])
            {
                cells.AutoFilter = true;
                cells.Style.Font.Bold = true;
                cells.Style.Font.Size = 11;
                cells.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
            }

            rowIndex++;

           int _pointer = 1;
           
            foreach (var colValue in columnValues)
            {
                if (_pointer > reportParams.ColumnNames.Count)
                {
                    rowIndex++;
                    _pointer = 1;
                }
                ws.Cells[rowIndex, _pointer].Value = colValue;
                _pointer = _pointer + 1;

            }


            rowIndex++;
          

            foreach (var cell in ws.Cells[startRowIndex, 1, rowIndex - 1, reportParams.ColumnNames.Count])
            {
                cell.Style.Border.Top.Style = ExcelBorderStyle.Thin;
                cell.Style.Border.Bottom.Style = ExcelBorderStyle.Thin;
                cell.Style.Border.Left.Style = ExcelBorderStyle.Thin;
                cell.Style.Border.Right.Style = ExcelBorderStyle.Thin;
                cell.Style.Border.Top.Color.SetColor(Color.LightGray);
                cell.Style.Border.Bottom.Color.SetColor(Color.LightGray);
                cell.Style.Border.Left.Color.SetColor(Color.LightGray);
                cell.Style.Border.Right.Color.SetColor(Color.LightGray);
            }

            //cell.Style.Border.Top.Color.SetColor(Color.LightGray);
            //cell.Style.Border.Bottom.Color.SetColor(Color.LightGray);
            //cell.Style.Border.Left.Color.SetColor(Color.LightGray);
            //cell.Style.Border.Right.Color.SetColor(Color.LightGray);


            return reportParams.Ep.GetAsByteArray();


        }


        public static byte[] GetExcel<T>(List<T> columnValues, ReportParams reportParams)
        {
            int startRowIndex = 7;
            if (reportParams.Param1 != null)
            {
                 startRowIndex = startRowIndex + reportParams.Param1.Count;
            }
            int rowIndex = startRowIndex;
            var wb = reportParams.Ep.Workbook;
            var ws = wb.Worksheets.Add(reportParams.SheetName);
           // ws.Cells.Style.Font.SetFromFont(font);
            ws = SetReportHeaders(ws, reportParams);
            int i = 1;
            foreach (var col in reportParams.ColumnNames)
            {
                ws.Cells[rowIndex, i].Value = col;
                i = i + 1;
            }

            // headers style
            using (var cells = ws.Cells[rowIndex, 1, rowIndex, i - 1])
            {
                cells.AutoFilter = true;
                cells.Style.Font.Bold = true;
                cells.Style.Font.Size = 11;
                cells.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
            }

            rowIndex++;

            foreach (var emp in columnValues)
            {
                int k = 1;
                foreach (var pname in reportParams.ColumnNames)
                {

                    var propertyType = emp.GetType().GetProperty(pname);
                    if (propertyType.PropertyType.Name == "DateTime")
                    {
                        ws.Cells[rowIndex, k].Value = emp.GetType().GetProperty(pname).GetValue(emp, null).ToString();

                    }
                    else
                    {


                        // propertyType.Name


                        ws.Cells[rowIndex, k].Value = emp.GetType().GetProperty(pname).GetValue(emp, null);
                    }
                    k = k + 1;

                }

                // ws.Cells[rowIndex,1,rowIndex,4].Style.Border = 
                rowIndex++;
            }

            foreach (var cell in ws.Cells[startRowIndex, 1, rowIndex - 1, reportParams.ColumnNames.Count])
            {
                cell.Style.Border.Top.Style = ExcelBorderStyle.Thin;
                cell.Style.Border.Bottom.Style = ExcelBorderStyle.Thin;
                cell.Style.Border.Left.Style = ExcelBorderStyle.Thin;
                cell.Style.Border.Right.Style = ExcelBorderStyle.Thin;
                cell.Style.Border.Top.Color.SetColor(Color.LightGray);
                cell.Style.Border.Bottom.Color.SetColor(Color.LightGray);
                cell.Style.Border.Left.Color.SetColor(Color.LightGray);
                cell.Style.Border.Right.Color.SetColor(Color.LightGray);
            }

            //cell.Style.Border.Top.Color.SetColor(Color.LightGray);
            //cell.Style.Border.Bottom.Color.SetColor(Color.LightGray);
            //cell.Style.Border.Left.Color.SetColor(Color.LightGray);
            //cell.Style.Border.Right.Color.SetColor(Color.LightGray);


            return reportParams.Ep.GetAsByteArray();

        }



        public static byte[] GetExcelUsingDictionary(List<Dictionary<string,string>> columnValues, ReportParams reportParams)
        {
            int startRowIndex = 7;
            if (reportParams.Param1 != null)
            {
                startRowIndex = startRowIndex + reportParams.Param1.Count;
            }
            int rowIndex = startRowIndex;
            var wb = reportParams.Ep.Workbook;
            var ws = wb.Worksheets.Add(reportParams.SheetName);
          //  ws.Cells.Style.Font.SetFromFont(font);
            ws = SetReportHeaders(ws, reportParams);
            int i = 1;
            foreach (var col in reportParams.ColumnNames)
            {
                ws.Cells[rowIndex, i].Value = col;
                i = i + 1;
            }

            // headers style
            using (var cells = ws.Cells[rowIndex, 1, rowIndex, i - 1])
            {
                cells.AutoFilter = true;
                cells.Style.Font.Bold = true;
                cells.Style.Font.Size = 11;
                cells.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
            }

            rowIndex++;

            foreach (var emp in columnValues)
            {
                int k = 1;
                foreach (var pname in reportParams.ColumnNames)
                {
                    string _value;
                    emp.TryGetValue(pname, out _value);
                    ws.Cells[rowIndex, k].Value = _value;
                    
                    k = k + 1;

                }

                // ws.Cells[rowIndex,1,rowIndex,4].Style.Border = 
                rowIndex++;
            }

            foreach (var cell in ws.Cells[startRowIndex, 1, rowIndex - 1, reportParams.ColumnNames.Count])
            {
                cell.Style.Border.Top.Style = ExcelBorderStyle.Thin;
                cell.Style.Border.Bottom.Style = ExcelBorderStyle.Thin;
                cell.Style.Border.Left.Style = ExcelBorderStyle.Thin;
                cell.Style.Border.Right.Style = ExcelBorderStyle.Thin;
                cell.Style.Border.Top.Color.SetColor(Color.LightGray);
                cell.Style.Border.Bottom.Color.SetColor(Color.LightGray);
                cell.Style.Border.Left.Color.SetColor(Color.LightGray);
                cell.Style.Border.Right.Color.SetColor(Color.LightGray);
            }

            //cell.Style.Border.Top.Color.SetColor(Color.LightGray);
            //cell.Style.Border.Bottom.Color.SetColor(Color.LightGray);
            //cell.Style.Border.Left.Color.SetColor(Color.LightGray);
            //cell.Style.Border.Right.Color.SetColor(Color.LightGray);


            return reportParams.Ep.GetAsByteArray();

        }



        private static ExcelWorksheet SetReportHeaders(ExcelWorksheet ws, ReportParams reportParams)
        {
            ws.View.ShowGridLines = false;
            //string path =   "\\acelogofull.png";
            //FileInfo logo = new FileInfo(path);
            //var picture = ws.Drawings.AddPicture("Company", logo);
            //picture.From.Column = 0;
            //picture.From.Row = 0;
            //picture.To.Row = 4;
            //picture.From.Column = 0;
            //picture.SetSize(90, 60);
            
            ws.Column(1).Width = 20;
 
            // Report Name Header
            using (var cells = ws.Cells[2, 3, 2, 4])
            {
                cells.Value = "Report Name:";
                cells.Style.Font.Bold = true;
                cells.Style.Font.Size = 10;
                cells.Merge = true;
                cells.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
            }

            // Report Name 
            using (var cells = ws.Cells[2, 5, 2, 8])
            {

                cells.Value = reportParams.ReportName;
                cells.Style.Font.Bold = true;
                cells.Style.Font.Size = 10;
                cells.Merge = true;
                cells.Style.HorizontalAlignment = ExcelHorizontalAlignment.Left;
            }

            // Report Name 
            using (var cells = ws.Cells[4, 6, 4, 6])
            {

                cells.Value = "Date:";
                cells.Style.Font.Bold = true;
                cells.Style.Font.Size = 8;
                cells.Merge = true;
                cells.Style.HorizontalAlignment = ExcelHorizontalAlignment.Left;
            }

            using (var cells = ws.Cells[5, 6, 5, 6])
            {

                cells.Value = "Time:";
                cells.Style.Font.Bold = true;
                cells.Style.Font.Size = 8;
                cells.Merge = true;
                cells.Style.HorizontalAlignment = ExcelHorizontalAlignment.Left;
            }

            using (var cells = ws.Cells[4, 7, 4, 9])
            {

                cells.Merge = true;
                cells.Value = DateTime.Now.ToLongDateString();
                cells.Style.Font.Size = 8;
                cells.Merge = true;
                cells.Style.HorizontalAlignment = ExcelHorizontalAlignment.Left;
            }

            using (var cells = ws.Cells[5, 7, 5, 7])
            {

                cells.Merge = true;
                cells.Value = DateTime.Now.ToLongTimeString();
                cells.Style.Font.Size = 8;
                cells.Merge = true;
                cells.Style.HorizontalAlignment = ExcelHorizontalAlignment.Left;
            }
            if (reportParams.Param1 != null)
            {
                int p = 6;
             foreach (var parm in reportParams.Param1)
             {

                using (var cells = ws.Cells[p, 1, p, 2])
                {

                    cells.Merge = true;
                    cells.Value = parm.Key + ":";
                   // cells.Style.Font.SetFromFont(font);
                    cells.Style.Font.Size = 8;
                    cells.Style.Font.Bold = true;
                    cells.Style.HorizontalAlignment = ExcelHorizontalAlignment.Left;
                }


                using (var cells = ws.Cells[p, 3, p, 5])
                {

                    cells.Merge = true;
                    cells.Value = parm.Value;
                   // cells.Style.Font.SetFromFont(font);
                    cells.Style.Font.Size = 8;
                    cells.Style.HorizontalAlignment = ExcelHorizontalAlignment.Left;
                }


                p = p + 1;
             }
            
                ws.View.FreezePanes(8 + reportParams.Param1.Count, ExcelPackage.MaxColumns -2);
            }
            else
            {
                ws.View.FreezePanes(8 , ExcelPackage.MaxColumns -2);
            }
            return ws;


        }

       
        private static readonly Font font = new Font("Tahoma", 10);


        public static List<string> FormatReportColumns(List<string> columnNames, string columnNameCommaDelimited )
        {
            string[] cols = columnNameCommaDelimited.Split(',');

            foreach(var col in cols)
            {
                columnNames.Remove(col.Trim());
            }

            return columnNames;

        }


        public static Dictionary<string,string> ConvertJsonStringToDictionary(string jsonString)
        {
           return JsonConvert.DeserializeObject<Dictionary<string, string>>(jsonString);
        }
    }
}
