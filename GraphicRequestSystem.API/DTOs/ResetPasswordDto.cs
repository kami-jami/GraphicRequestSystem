using System.ComponentModel.DataAnnotations;

namespace GraphicRequestSystem.API.DTOs
{
    public class ResetPasswordDto
    {
        [Required(ErrorMessage = "رمز عبور جدید الزامی است.")]
        [MinLength(6, ErrorMessage = "رمز عبور باید حداقل 6 کاراکتر باشد.")]
        public string NewPassword { get; set; } = string.Empty;

        [Required(ErrorMessage = "تایید رمز عبور الزامی است.")]
        [Compare("NewPassword", ErrorMessage = "رمز عبور و تایید آن باید یکسان باشند.")]
        public string ConfirmPassword { get; set; } = string.Empty;
    }
}
