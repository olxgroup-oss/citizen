const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const debug = require('debug')('citizen:server');

const s3 = new S3Client({});

const stream2buffer = (stream) => new Promise((resolve, reject) => {
  const buffer = [];
  stream.on('data', (chunk) => buffer.push(chunk));
  stream.on('end', () => resolve(Buffer.concat(buffer)));
  stream.on('error', (err) => reject(err));
});

const S3_BUCKET = process.env.CITIZEN_AWS_S3_BUCKET;
if (process.env.CITIZEN_STORAGE === 's3' && !S3_BUCKET) {
  throw new Error('S3 storage requires CITIZEN_AWS_S3_BUCKET. Additionally, ensure that either '
    + 'AWS_PROFILE or AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are set. '
    + 'If running on AWS EC2 or ECS, IAM Roles may be used.');
}

module.exports = {
  type: () => 's3',
  saveModule: async (path, tarball) => {
    debug(`save the module into ${path}.`);

    if (!path) { throw new Error('path is required.'); }
    if (!tarball) { throw new Error('tarball is required.'); }

    const params = {
      Bucket: S3_BUCKET,
      Key: `modules/${path}`,
      Body: tarball,
    };
    const result = await s3.send(new PutObjectCommand(params));

    if (result.ETag) {
      return true;
    }
    return false;
  },
  hasModule: async (path) => {
    const params = {
      Bucket: S3_BUCKET,
      Key: `modules/${path}`,
    };

    try {
      const module = await s3.send(new GetObjectCommand(params));
      if (module.Body) {
        debug(`the module already exist: ${path}.`);
        return true;
      }
    } catch (err) {
      if (err.name === 'NoSuchKey') {
        debug(`the module doesn't exist: ${path}.`);
        return false;
      }

      throw err;
    }

    debug(`the module doesn't exist: ${path}.`);
    return false;
  },
  getModule: async (path) => {
    debug(`get the module: ${path}.`);
    const params = {
      Bucket: S3_BUCKET,
      Key: `modules/${path}`,
    };
    try {
      const content = await s3.send(new GetObjectCommand(params));
      return stream2buffer(content.Body);
    } catch (err) {
      debug(err);
      return null;
    }
  },
  saveProvider: async (path, tarball) => {
    debug(`save the provider into ${path}.`);

    if (!path) { throw new Error('path is required.'); }
    if (!tarball) { throw new Error('tarball is required.'); }

    const params = {
      Bucket: S3_BUCKET,
      Key: `providers/${path}`,
      Body: tarball,
    };
    const result = await s3.send(new PutObjectCommand(params));

    if (result.ETag) {
      return true;
    }
    return false;
  },
  hasProvider: async (path) => {
    const params = {
      Bucket: S3_BUCKET,
      Key: `providers/${path}`,
    };

    try {
      const module = await s3.send(new GetObjectCommand(params));
      if (module.Body) {
        debug(`the provider already exist: ${path}.`);
        return true;
      }
    } catch (err) {
      if (err.name === 'NoSuchKey') {
        debug(`the provider doesn't exist: ${path}.`);
        return false;
      }

      throw err;
    }

    debug(`the provider doesn't exist: ${path}.`);
    return false;
  },
  getProvider: async (path) => {
    debug(`get the provider: ${path}.`);
    const params = {
      Bucket: S3_BUCKET,
      Key: `providers/${path}`,
    };
    try {
      const content = await s3.send(new GetObjectCommand(params));
      return stream2buffer(content.Body);
    } catch (err) {
      debug(err);
      return null;
    }
  },
};
