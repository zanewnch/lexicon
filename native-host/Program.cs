using System.IO.Pipes;
using System.Net.Sockets;
using System.Text;
using System.Text.Json;

const string PipeName = "lexicon-youtube-bridge";
const string MacSocketPath = "/tmp/lexicon-youtube-bridge.sock";
const int MaxMessageBytes = 1024 * 1024;
using var stdoutLock = new SemaphoreSlim(1, 1);
Stream bridge;

try
{
    bridge = await ConnectBridgeAsync();
}
catch
{
    await WriteNativeMessageAsync(new { type = "transcript:error", videoId = "", code = "lexicon-unavailable", message = "找不到 Lexicon。請先啟動或重新安裝 Lexicon。" });
    return;
}
await using var bridgeStream = bridge;

var pipeReader = ReadPipeAsync(bridgeStream);
while (true)
{
    var lengthBytes = await ReadExactlyOrNullAsync(Console.OpenStandardInput(), 4);
    if (lengthBytes is null) break;
    var length = BitConverter.ToInt32(lengthBytes, 0);
    if (length is < 0 or > MaxMessageBytes)
    {
        await WriteNativeMessageAsync(new { type = "transcript:error", videoId = "", code = "message-too-large", message = "字幕資料過大。" });
        break;
    }
    var body = await ReadExactlyOrNullAsync(Console.OpenStandardInput(), length);
    if (body is null) break;
    await bridgeStream.WriteAsync(body);
    await bridgeStream.WriteAsync(new byte[] { (byte)'\n' });
    await bridgeStream.FlushAsync();
}

await pipeReader;

async Task ReadPipeAsync(Stream stream)
{
    using var reader = new StreamReader(stream, new UTF8Encoding(false), leaveOpen: true);
    while (await reader.ReadLineAsync() is { } line)
    {
        try { await WriteNativeMessageAsync(JsonDocument.Parse(line).RootElement); }
        catch { /* Invalid local bridge response must not corrupt Chrome's native stream. */ }
    }
}

async Task WriteNativeMessageAsync<T>(T message)
{
    var body = JsonSerializer.SerializeToUtf8Bytes(message);
    var length = BitConverter.GetBytes(body.Length);
    await stdoutLock.WaitAsync();
    try
    {
        var output = Console.OpenStandardOutput();
        await output.WriteAsync(length);
        await output.WriteAsync(body);
        await output.FlushAsync();
    }
    finally { stdoutLock.Release(); }
}

static async Task<byte[]?> ReadExactlyOrNullAsync(Stream stream, int length)
{
    var buffer = new byte[length];
    var offset = 0;
    while (offset < length)
    {
        var read = await stream.ReadAsync(buffer.AsMemory(offset, length - offset));
        if (read == 0) return offset == 0 ? null : throw new EndOfStreamException();
        offset += read;
    }
    return buffer;
}

static async Task<Stream> ConnectBridgeAsync()
{
    if (OperatingSystem.IsWindows())
    {
        var pipe = new NamedPipeClientStream(".", PipeName, PipeDirection.InOut, PipeOptions.Asynchronous);
        await pipe.ConnectAsync(1500);
        return pipe;
    }

    var socket = new Socket(AddressFamily.Unix, SocketType.Stream, ProtocolType.Unspecified);
    try
    {
        using var cancellation = new CancellationTokenSource(1500);
        await socket.ConnectAsync(new UnixDomainSocketEndPoint(MacSocketPath), cancellation.Token);
        return new NetworkStream(socket, ownsSocket: true);
    }
    catch
    {
        socket.Dispose();
        throw;
    }
}
