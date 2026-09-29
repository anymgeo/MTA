using SkiaSharp;
namespace Mta.Api;
public record MapImageInfo(int Width, int Height, string Extension)
{
    public static MapImageInfo Read(Stream stream)
    {
        using var data = SKData.Create(stream);
        using var codec = SKCodec.Create(data);
        if (codec == null) throw new InvalidDataException("Invalid image");
        var extension = codec.EncodedFormat switch { SKEncodedImageFormat.Png => ".png", SKEncodedImageFormat.Jpeg => ".jpg", SKEncodedImageFormat.Webp => ".webp", _ => throw new InvalidDataException("Unsupported image") };
        return new(codec.Info.Width, codec.Info.Height, extension);
    }
}
