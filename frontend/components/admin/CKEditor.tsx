'use client';

import { useSession } from 'next-auth/react';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

interface CKEditorProps {
  data?: string;
  onChange?: (data: string) => void;
  onReady?: (editor: any) => void;
}

export interface CKEditorRef {
  getData: () => string;
  setData: (data: string) => void;
}

const CKEditor = forwardRef<CKEditorRef, CKEditorProps>(({ data = '', onChange, onReady }, ref) => {
  const editorRef = useRef<any>(null);
  const { data: session } = useSession();

  useImperativeHandle(ref, () => ({
    getData: () => editorRef.current?.getData() || '',
    setData: (newData: string) => editorRef.current?.setData(newData),
  }));

  useEffect(() => {
    let isMounted = true;

    const initializeEditor = async () => {
      try {
        // Dynamic import of CKEditor to ensure it runs client-side only
        const { default: ClassicEditor } = await import('@ckeditor/ckeditor5-build-classic');

        if (!isMounted) return;

        // Custom upload adapter for images
        class CustomUploadAdapter {
          constructor(
            private loader: any,
            private accessToken?: string
          ) {}

          upload() {
            return this.loader.file.then((file: File) => {
              return new Promise((resolve, reject) => {
                const formData = new FormData();
                formData.append('file', file);

                fetch(
                  `${process.env.NEXT_PUBLIC_BACKEND_REST_URL || 'http://localhost:3001'}/rest/media/upload`,
                  {
                    method: 'POST',
                    headers: {
                      ...(this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {}),
                    },
                    body: formData,
                  }
                )
                  .then(response => response.json())
                  .then(result => {
                    if (result.id && result.url) {
                      resolve({
                        default: result.url,
                      });
                    } else {
                      reject('Upload failed');
                    }
                  })
                  .catch(error => {
                    console.error('Upload error:', error);
                    reject(error);
                  });
              });
            });
          }

          abort() {
            // Implement abort logic if needed
          }
        }

        // Plugin to add custom upload adapter
        function CustomUploadAdapterPlugin(editor: any) {
          editor.plugins.get('FileRepository').createUploadAdapter = (loader: any) => {
            return new CustomUploadAdapter(loader, session?.accessToken);
          };
        }

        const editorElement = document.querySelector('#editor') as HTMLElement;
        if (!editorElement) {
          console.error('Editor element not found');
          return;
        }

        const editor = await ClassicEditor.create(editorElement, {
          extraPlugins: [CustomUploadAdapterPlugin],
          toolbar: {
            items: [
              'heading',
              '|',
              'bold',
              'italic',
              'link',
              'bulletedList',
              'numberedList',
              '|',
              'outdent',
              'indent',
              '|',
              'imageUpload',
              'blockQuote',
              'insertTable',
              'mediaEmbed',
              '|',
              'undo',
              'redo',
            ],
          },
          language: 'en',
          image: {
            toolbar: [
              'imageTextAlternative',
              'imageStyle:inline',
              'imageStyle:block',
              'imageStyle:side',
            ],
          },
          table: {
            contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells'],
          },
        });

        if (!isMounted) {
          editor.destroy();
          return;
        }

        editorRef.current = editor;

        // Set initial data
        if (data) {
          editor.setData(data);
        }

        // Listen for changes
        editor.model.document.on('change:data', () => {
          if (onChange) {
            onChange(editor.getData());
          }
        });

        if (onReady) {
          onReady(editor);
        }
      } catch (error) {
        console.error('CKEditor initialization failed:', error);
      }
    };

    initializeEditor();

    return () => {
      isMounted = false;
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, [session?.accessToken]);

  return <div id="editor" style={{ minHeight: '300px' }} />;
});

CKEditor.displayName = 'CKEditor';

export default CKEditor;
