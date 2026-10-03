using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Scootr.Core.Domain.Settings
{
    public class Setting
    {
        [Key]
        [Required]
        public int Id { get;set; }
        public string Name { get; set; }
        public string Value     { get; set; }
 
    }
}
