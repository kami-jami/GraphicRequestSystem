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
            // Trim whitespace from inputs to handle mobile browser quirks
            var username = loginDto.Username?.Trim();
            var password = loginDto.Password;

            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
            {
                return Unauthorized("نام کاربری یا رمز عبور خالی است.");
            }

            // Try to find user by username first, then by email
            var user = await _userManager.FindByNameAsync(username);
            if (user == null)
            {
                user = await _userManager.FindByEmailAsync(username);
            }

            // Check if user exists
            if (user == null)
            {
                // Log for debugging (remove in production)
                Console.WriteLine($"Login failed: User not found for username/email: {username}");
                return Unauthorized("نام کاربری یا رمز عبور اشتباه است.");
            }

            // Check if user is active
            if (!user.IsActive)
            {
                Console.WriteLine($"Login failed: User {username} is inactive");
                return Unauthorized("حساب کاربری شما غیرفعال شده است.");
            }

            // Check password
            var passwordValid = await _userManager.CheckPasswordAsync(user, password);
            if (!passwordValid)
            {
                Console.WriteLine($"Login failed: Invalid password for user: {username}");
                return Unauthorized("نام کاربری یا رمز عبور اشتباه است.");
            }

            // Password is valid, create token
            var authClaims = new List<Claim>
            {
                new Claim("id", user.Id),
                new Claim("username", user.UserName ?? ""),
                new Claim("firstName", user.FirstName ?? ""),
                new Claim("lastName", user.LastName ?? ""),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            };

            var userRoles = await _userManager.GetRolesAsync(user);
            foreach (var userRole in userRoles)
            {
                authClaims.Add(new Claim("role", userRole));
            }

            var token = GetToken(authClaims);

            Console.WriteLine($"Login successful for user: {username}");

            return Ok(new
            {
                token = new JwtSecurityTokenHandler().WriteToken(token),
                expiration = token.ValidTo
            });
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