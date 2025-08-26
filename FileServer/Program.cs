var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(x =>
{
    x.AllowAnyHeader()
    .AllowAnyMethod()
    .AllowAnyOrigin()
    .Build();
});

app.UseStaticFiles();

app.UseHttpsRedirection();

app.MapGet("/files/", () =>
{
    var dirInfo = new DirectoryInfo(Path.GetFullPath("./files"));
    Console.WriteLine(dirInfo.FullName);

    var fileNames = dirInfo.GetFiles().Select(x => new FileDTO(Guid.NewGuid(), x.Name));

    return Results.Ok(fileNames);
})
.WithName("GetFiles")
.WithOpenApi();

app.MapGet("/files/{fileName}", (string fileName) =>
{
    var dirInfo = new DirectoryInfo(Path.GetFullPath("./files"));

    var file = dirInfo.GetFiles().FirstOrDefault(x => x.Name == fileName);
    return Results.File(File.ReadAllBytes(file.FullName), "application/octet-stream", fileName);
})
.WithName("GetFile")
.WithOpenApi();

app.Run();

record FileDTO(Guid Id, string Name);
