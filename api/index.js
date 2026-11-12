export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    message: 'StudyBook Serverless API',
    endpoints: [
      '/api/health',
      '/api/storage/upload-url',
      '/api/storage/download-url',
      '/api/storage/delete',
      '/api/storage/delete-batch',
      '/api/storage/cleanup-expired',
    ],
  });
}
