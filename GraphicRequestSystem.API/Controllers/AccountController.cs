using GraphicRequestSystem.API.Core.Entities;
using GraphicRequestSystem.API.DTOs;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace GraphicRequestSystem.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccountController : ControllerBase
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly IConfiguration _configuration;

        public AccountController(UserManager<AppUser> userManager, IConfiguration configuration)
        {
            _userManager = userManager;
            _configuration = configuration;
        }

        // POST: api/Account/register
        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto registerDto)
        {
            var userExists = await _userManager.FindByNameAsync(registerDto.Username);
            if (userExists != null)
            {
                return BadRequest("User already exists!");
            }

            AppUser user = new()
            {
                Email = registerDto.Email,
                SecurityStamp = Guid.NewGuid().ToString(),
                UserName = registerDto.Username
            };

            var result = await _userManager.CreateAsync(user, registerDto.Password);
            if (!result.Succeeded)
            {
                return BadRequest(result.Errors);
            }

            await _userManager.AddToRoleAsync(user, "Requester");

            return Ok("User created successfully!");
        }

        // POST: api/Account/login
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto loginDto)
        {
            var user = await _userManager.FindByNameAsync(loginDto.Username);

            if (user != null && !user.IsActive)
                return Unauthorized("حساب کاربری شما غیرفعال شده است.");

            if (user != null && await _userManager.CheckPasswordAsync(user, loginDto.Password))
            {
                var authClaims = new List<Claim>
                {
                    new Claim("id", user.Id),
                    new Claim("username", user.UserName),
                    new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                };


                var userRoles = await _userManager.GetRolesAsync(user);
                foreach (var userRole in userRoles)
                {
                    authClaims.Add(new Claim("role", userRole));
                }
                

                var token = GetToken(authClaims);

                return Ok(new
                {
                    token = new JwtSecurityTokenHandler().WriteToken(token),
                    expiration = token.ValidTo
                });
            }
            return Unauthorized();
        }

        private JwtSecurityToken GetToken(List<Claim> authClaims)
        {
            var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                expires: DateTime.Now.AddHours(3),
                claims: authClaims,
                signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
                );

            return token;
        }
    }
}