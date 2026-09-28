FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY Mta.Api.csproj .
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /out --no-restore
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /out .
RUN mkdir -p /data/media /data/keys && chown -R $APP_UID:$APP_UID /data
USER $APP_UID
ENV ASPNETCORE_URLS=http://+:8080 StoragePath=/data
EXPOSE 8080
ENTRYPOINT ["dotnet", "Mta.Api.dll"]
