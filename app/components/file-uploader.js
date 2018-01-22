import Component from '@ember/component';
import { inject as service } from '@ember/service';

export default Component.extend({
    files: [],
    folder: '',
    ajax: service(),
    flashMessages: service(),
    
    didInsertElement: function() {
        this.set('files', []);
    },
    
    fileCount: function() {
        return this.get('files.length');
    }.property('files'),
    
    showSelector: function() {
        return !this.get('fileCount');
    }.property('fileCount'),
    
    actions: {
        filesSelected: function(e) {
            let selectedFiles = e.target.files;
            let info = [];
            for (var i = 0; i < selectedFiles.length; i++) {
                let file = selectedFiles.item(i);
                let fileInfo = Ember.Object.create( {
                    file: file,
                    name: file.name,
                    data: null,
                    folder: this.get('folder').toLowerCase(),
                    sizeKb: Math.round(file.size / 1000),
                    url: URL.createObjectURL(file)
                });
                
                var reader = new FileReader();
                reader.onload = (function(info) { return function(e) { info.data = e.target.result; }; })(fileInfo);
                reader.readAsDataURL(file);
                    
                info.push(fileInfo);
            }
            this.set('files', info);
        },
        
        removeFile: function(file) { 
            let newFiles = this.get('files');
            let filteredFiles = newFiles.filter(f => f != file);
            this.set('files', filteredFiles);
        },
        
        reset: function() {
            this.set('files', []);
        },
        
        uploadFile: function(file) {
            let aj = this.get('ajax');
            
            if (!file.data) {
                this.get('flashMessages').danger('That file is not ready for upload yet.  Give it a few more seconds.');
                return;
            }
            
            let folder = file.folder.toLowerCase();
            let name = file.name.toLowerCase();
            
            aj.queryOne('uploadFile', {
                 name: name,
                 size_kb: file.sizeKb,
                 url: file.url,
                 data: file.data,
                 allow_overwrite: file.allowOverwrite,
                 folder: folder
               })
            .then( (response) => {
                if (response.error) {
                    file.set('upload_message', `Upload Failed! ${response.error}`);
                    file.set('upload_success', false);
                }
                else {
                    file.set('upload_message', 'Upload Succeeded!');                    
                    file.set('upload_success', true);
                    this.sendAction('uploaded', folder, name);
                }
            });
        }
    }
    
});