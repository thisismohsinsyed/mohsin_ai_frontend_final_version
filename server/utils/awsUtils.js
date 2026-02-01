import AWS from "aws-sdk";
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";
dotenv.config();
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

export const listUrls = async (prefix = process.env.prefix) => {
  const params = {
    Bucket: process.env.bucket,
    Prefix: prefix,
  };
  //   const baseUrl = process.env.URL;
  const data = await s3.listObjects(params).promise();
  const _sourceVideos = await data.Contents;
  const urls = _sourceVideos
    .filter((item) => item.Key && item.Key.includes(".mp4"))
    .map((item) => `${process.env.URL}/${item.Key}`);

  return urls;
};

export const uploadAudio = (fileName) => {
  return new Promise((resolve, reject) => {
    const fileContent = fs.readFileSync(fileName);
    const params = {
      Bucket: "dialoga-machine-learning",
      Key: `mimic/audios/${path.basename(fileName)}`,
      Body: fileContent,
      ACL: "public-read",
    };
    s3.upload(params, (s3Err, info) => {
      if (s3Err) {
        return reject(s3Err);
      }
      return resolve(info.Location);
    });
  });
};



export const uploadVideo = (fileName) => {
  return new Promise((resolve, reject) => {
    const fileContent = fs.readFileSync(fileName);

    const params = {
      Bucket: "dialoga-machine-learning",
      Key: `mimic/source/${path.basename(fileName)}`, 
      Body: fileContent,
      ACL: "public-read",
      ContentType: "video/mp4",
    };

    s3.upload(params, (s3Err, info) => {
      if (s3Err) {
        return reject(s3Err);
      }
      return resolve(info.Location); // S3 public URL
    });
  });
};

export default listUrls;
