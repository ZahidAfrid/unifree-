import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaUpload, 
  FaFile, 
  FaFilePdf, 
  FaFileImage, 
  FaFileWord, 
  FaFileExcel,
  FaDownload,
  FaTrash,
  FaEye,
  FaClock,
  FaUser,
  FaUserTie
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { db, storage } from '@/firebase/firebase.config';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  deleteDoc,
  doc,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { sendDocumentUploadNotification } from '@/utils/notifications';

const DocumentUpload = ({ projectId, userRole, onDocumentUploaded, projectData }) => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [projectId]);

  const fetchDocuments = async () => {
    if (!projectId) return;

    try {
      console.log('Fetching documents for project:', projectId);
      const documentsQuery = query(
        collection(db, 'project_documents'),
        where('projectId', '==', projectId)
      );
      const documentsSnapshot = await getDocs(documentsQuery);
      console.log('Found', documentsSnapshot.size, 'documents for project');
      const documentsList = documentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Documents list:', documentsList);
      setDocuments(documentsList);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FaFilePdf className="text-red-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FaFileImage className="text-green-500" />;
      case 'doc':
      case 'docx':
        return <FaFileWord className="text-blue-500" />;
      case 'xls':
      case 'xlsx':
        return <FaFileExcel className="text-green-600" />;
      default:
        return <FaFile className="text-gray-500" />;
    }
  };

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Upload file to Firebase Storage
      const storageRef = ref(storage, `project_documents/${projectId}/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          toast.error('Failed to upload file');
          setUploading(false);
        },
        async () => {
          // Upload completed successfully
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Save document metadata to Firestore
          const documentData = {
            projectId,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            downloadURL,
            uploadedBy: user.uid,
            uploaderName: user.displayName || 'Anonymous',
            uploaderRole: userRole,
            uploadedAt: serverTimestamp(),
            storagePath: uploadTask.snapshot.ref.fullPath
          };

          await addDoc(collection(db, 'project_documents'), documentData);
          
          toast.success('Document uploaded successfully!');
          fetchDocuments(); // Refresh the documents list
          
          if (onDocumentUploaded) {
            onDocumentUploaded(documentData);
          }
          
          // Send notification to the other party
          try {
            if (projectData) {
              const recipientId = userRole === 'client' ? projectData.freelancerId : projectData.clientId;
              const recipientType = userRole === 'client' ? 'freelancer' : 'client';
              const projectTitle = projectData.projectTitle || projectData.title || 'Your Project';
              const uploaderName = user.displayName || (userRole === 'client' ? 'Client' : 'Freelancer');

              await sendDocumentUploadNotification(
                projectId,
                projectTitle,
                recipientId,
                recipientType,
                file.name,
                uploaderName,
                userRole
              );
            } else {
              // If projectData is not available, try to fetch project participants
              const { collection, query, where, getDocs } = await import('firebase/firestore');
              
              if (userRole === 'client') {
                // Find freelancer from accepted proposals
                const proposalsQuery = query(
                  collection(db, 'accepted_proposals'),
                  where('projectId', '==', projectId)
                );
                const proposalsSnapshot = await getDocs(proposalsQuery);
                
                if (!proposalsSnapshot.empty) {
                  const proposalData = proposalsSnapshot.docs[0].data();
                  await sendDocumentUploadNotification(
                    projectId,
                    'Project Document',
                    proposalData.freelancerId,
                    'freelancer',
                    file.name,
                    user.displayName || 'Client',
                    'client'
                  );
                }
              } else {
                // Find client from project
                const projectDocRef = doc(db, 'projects', projectId);
                const projectSnapshot = await getDoc(projectDocRef);
                
                if (projectSnapshot.exists()) {
                  const projectData = projectSnapshot.data();
                  await sendDocumentUploadNotification(
                    projectId,
                    projectData.title || 'Project Document',
                    projectData.clientId,
                    'client',
                    file.name,
                    user.displayName || 'Freelancer',
                    'freelancer'
                  );
                }
              }
            }
          } catch (notificationError) {
            console.error('Error sending document notification:', notificationError);
          }
          
          setUploading(false);
          setUploadProgress(0);
        }
      );
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (document) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      // Delete from Storage
      const storageRef = ref(storage, document.storagePath);
      await deleteObject(storageRef);

      // Delete from Firestore
      await deleteDoc(doc(db, 'project_documents', document.id));

      toast.success('Document deleted successfully');
      fetchDocuments(); // Refresh the documents list
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center">
          <FaFile className="mr-2 text-indigo-500" />
          Project Documents
        </h3>
        <span className="text-sm text-gray-500">
          {documents.length} document{documents.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive 
            ? 'border-indigo-500 bg-indigo-50' 
            : 'border-gray-300 hover:border-indigo-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {uploading ? (
          <div className="space-y-4">
            <div className="w-12 h-12 mx-auto bg-indigo-100 rounded-full flex items-center justify-center">
              <FaUpload className="text-indigo-600 animate-bounce" />
            </div>
            <div>
              <p className="text-gray-600 font-medium">Uploading...</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-1">{Math.round(uploadProgress)}%</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
              <FaUpload className="text-gray-400" />
            </div>
            <div>
              <p className="text-gray-600 font-medium">
                Drag and drop files here, or{' '}
                <label className="text-indigo-600 hover:text-indigo-700 cursor-pointer font-semibold">
                  browse
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                  />
                </label>
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Supports: PDF, DOC, XLS, Images (Max 10MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Documents List */}
      {documents.length > 0 && (
        <div className="mt-6 space-y-3">
          <h4 className="font-semibold text-gray-900">Uploaded Documents</h4>
          {documents.map((document) => (
            <motion.div
              key={document.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-3">
                <div className="text-2xl">
                  {getFileIcon(document.fileName)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{document.fileName}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{formatFileSize(document.fileSize)}</span>
                    <div className="flex items-center space-x-1">
                      {document.uploaderRole === 'client' ? (
                        <FaUserTie className="text-blue-600" />
                      ) : (
                        <FaUser className="text-green-600" />
                      )}
                      <span>{document.uploaderName}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FaClock />
                      <span>
                        {document.uploadedAt 
                          ? new Date(document.uploadedAt.seconds * 1000).toLocaleDateString()
                          : 'Recently'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <a
                  href={document.downloadURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  title="View/Download"
                >
                  <FaEye />
                </a>
                <a
                  href={document.downloadURL}
                  download={document.fileName}
                  className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                  title="Download"
                >
                  <FaDownload />
                </a>
                {document.uploadedBy === user.uid && (
                  <button
                    onClick={() => handleDeleteDocument(document)}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentUpload; 