const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'dk9pid4ec',
  api_key: '622254167166872',
  api_secret: 'TU77kuEPGG8MEzcGe9phVvKRwjA',
});

async function testUpload() {
  const fs = require('fs');
  // create dummy image
  fs.writeFileSync('test.jpg', 'fake image content');

  try {
    const res = await cloudinary.uploader.upload('test.jpg', {
        folder: 'test'
    });
    console.log("Success:", res);
  } catch (error) {
    console.error("Upload Error:", error);
  }
}
testUpload();
