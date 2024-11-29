import { writeFile } from "fs/promises";

export default function Converter() {

  async function handleUpload(formData: FormData) {
    "use server";
    const audioFile = formData.get("m3u8") as File;
  
    if (!audioFile) {
      throw new Error("No file uploaded");
    }
  
    // Check file type
    if (!audioFile.name.endsWith(".m3u8")) {
      throw new Error("Invalid file type. Please upload an .m3u8 file.");
    }
  
    const buffer = await audioFile.arrayBuffer();
    const fileContent = Buffer.from(buffer).toString("utf-8");
  
    // Parse the .m3u8 file to extract song info
    const lines = fileContent.split("\n");
    const songs: string[] = [];
  
    for (let i = 0; i < lines.length; i++) {
      if (i % 2 === 0) continue; // Skip every other line, starting with the first
  
      const line = lines[i];
      const commaIndex = line.indexOf(",");
  
      if (commaIndex !== -1) {
        let songInfo = line.slice(commaIndex + 1).trim();
        songInfo = songInfo.replace(/ - /g, " "); // Replace " - " with a single space
        songs.push(songInfo);
      }
    }
  
    // Print the array to the console
    console.log("Parsed Songs Array:", songs);
  }
  
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold pb-24">M3U8 TO SPOTIFY</h1>
      <form action={handleUpload}>
        <label htmlFor="m3u8" className="block">
          Audio file:
        </label>
        <input type="file" name="m3u8" className="w-96 p-4" />
        <button className="bg-blue-500 text-white p-4 rounded">Submit</button>
      </form>
    </main>
  );
}
