import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaHandshake, 
  FaTimes, 
  FaUpload, 
  FaFileAlt, 
  FaTrash,
  FaUser,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaClipboardCheck,
  FaPaperPlane
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/firebase/firebase.config';

const ProjectHandoverModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  project, 
  clientName,
  freelancerName,
  loading = false 
}) => {
  const [handoverMessage, setHandoverMessage] = useState('');
  const [documents, setDocuments] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileUpload = async (files) => {
    const fileArray = Array.from(files);
    setUploadingFiles(fileArray.map(file => ({ name: file.name, progress: 0 })));

    try {
      const uploadPromises = fileArray.map(async (file, index) => {
        const storageRef = ref(storage, `handover_documents/${project.id}/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        return new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadingFiles(prev => 
                prev.map((f, i) => i === index ? { ...f, progress } : f)
              );
            },
            (error) => {
              console.error('Upload error:', error);
              reject(error);
            },
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve({
                name: file.name,
                url: downloadURL,
                size: file.size,
                type: file.type,
                uploadedAt: new Date()
              });
            }
          );
        });
      });

      const uploadedDocs = await Promise.all(uploadPromises);
      setDocuments(prev => [...prev, ...uploadedDocs]);
      setUploadingFiles([]);
      toast.success(`${uploadedDocs.length} document(s) uploaded successfully!`);
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload some files');
      setUploadingFiles([]);
    }
  };

  const removeDocument = (index) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!handoverMessage.trim()) {
      toast.error('Please provide a handover message');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm({
        message: handoverMessage,
        documents,
        projectId: project.id
      });
      onClose();
      setHandoverMessage('');
      setDocuments([]);
    } catch (error) {
      console.error('Error initiating handover:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <FaHandshake className="text-purple-600 text-xl" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Project Handover
                </h3>
                <p className="text-sm text-gray-500">
                  Deliver final project assets and documentation
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FaTimes />
            </button>
          </div>

          {/* Project Details */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg mb-6 border border-purple-100">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
              <FaClipboardCheck className="mr-2 text-purple-600" />
              {project?.title}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <FaUser className="text-gray-500" />
                <span className="text-gray-600">Client:</span>
                <span className="font-medium">{clientName}</span>
              </div>
              <div className="flex items-center space-x-2">
                <FaMoneyBillWave className="text-gray-500" />
                <span className="text-gray-600">Budget:</span>
                <span className="font-medium">${project?.budget}</span>
              </div>
              <div className="flex items-center space-x-2">
                <FaCalendarAlt className="text-gray-500" />
                <span className="text-gray-600">Started:</span>
                <span className="font-medium">
                  {project?.createdAt ? new Date(project.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Handover Form */}
          <div className="space-y-6">
            {/* Handover Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Handover Message *
              </label>
              <textarea
                value={handoverMessage}
                onChange={(e) => setHandoverMessage(e.target.value)}
                placeholder="Describe the completed work, provide instructions, notes, or any important information for the client..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                rows={4}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This message will be sent to the client along with the project files.
              </p>
            </div>

            {/* Document Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Deliverables
              </label>
              
              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                <input
                  type="file"
                  multiple
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.doc,.docx,.zip,.rar,.jpg,.jpeg,.png,.gif,.mp4,.mov,.avi"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <FaUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-purple-600 hover:text-purple-500">
                      Click to upload files
                    </span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, DOC, ZIP, Images, Videos up to 10MB each
                  </p>
                </label>
              </div>

              {/* Upload Progress */}
              {uploadingFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {uploadingFiles.map((file, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">{file.name}</span>
                        <span className="text-sm text-gray-500">{Math.round(file.progress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${file.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Uploaded Documents */}
              {documents.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">
                    Uploaded Documents ({documents.length})
                  </h5>
                  <div className="space-y-2">
                    {documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-200">
                        <div className="flex items-center space-x-3">
                          <FaFileAlt className="text-green-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(doc.size)}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeDocument(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Handover Checklist */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                <FaClipboardCheck className="mr-2 text-purple-600" />
                Handover Checklist
              </h5>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded text-purple-600" defaultChecked />
                  <span>All project requirements have been completed</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded text-purple-600" defaultChecked />
                  <span>Final deliverables are included in the upload</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded text-purple-600" defaultChecked />
                  <span>Documentation and instructions are provided</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded text-purple-600" defaultChecked />
                  <span>Project is ready for client review</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !handoverMessage.trim()}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Initiating Handover...</span>
                </>
              ) : (
                <>
                  <FaPaperPlane />
                  <span>Initiate Handover</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProjectHandoverModal; 