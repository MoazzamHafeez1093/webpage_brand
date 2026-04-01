const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'Root',
  api_key: '622254167166872',
  api_secret: 'TU77kuEPGG8MEzcGe9phVvKRwjA',
});

async function test() {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request({
      timestamp: timestamp,
      folder: 'test'
    }, 'TU77kuEPGG8MEzcGe9phVvKRwjA');
    console.log("Signature generated:", signature);
  } catch (e) {
    console.error("Signature error:", e);
  }
}
test();
