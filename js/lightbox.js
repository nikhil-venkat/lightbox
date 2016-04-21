var lightBoxService = function(){};

lightBoxService.prototype = {
    //constants 
    constants: {
        api_key: 'b1c12e607bad259e49b47f9d3a936e15',
        photoset_id:'72157666970496405',
        user_id: '94943647%40N02',
        auth_token: '72157665050798654-dbdf19cd483108e9',
        api_sig: 'a05c14083dfd9116bc815389373d8fc8'
    },
    //API endpoints
    urlMap: {
        getPhotos: "https://api.flickr.com/services/rest/?method=flickr.photosets.getPhotos&api_key={0}&photoset_id={1}&user_id={2}&extras=url_sq%2C+url_t%2C+url_s%2C+url_m%2C+url_o&format=json&nojsoncallback=1"
    },
    //photo count
    photosCount: 0,
    //array to hold photo list
    photosList: [],
    lightBoxMap: {},
    options: {},
    //helper for ajax 
    makeAjaxCall: function(url,method,data,callback){
        if(!method){
            method = 'get';
        }
        var xhr = new XMLHttpRequest();

        xhr.onreadystatechange = ensureReadiness;
         
        function ensureReadiness() {
            if(xhr.readyState < 4) {
                return;
            }
            
            if(xhr.status !== 200) {
                callback(xhr);
            }
 
            // success 
            if(xhr.readyState === 4) {
                callback(xhr);
            }
        }

        xhr.open(method,url,true);
        //set header for post
        if(method==='post'){
           xhr.setRequestHeader('Content-type','application/json');
        }
        if(data){
            //post data as string to server
            data = JSON.stringify(data);
            xhr.send(data);
        }else{
            xhr.send();
        }

    },
    //save to localstorage
    saveToLocalStorage: function(photo){
        localStorage.setItem('lightbox_photo', JSON.stringify(photo));
    },
    //save to localstorage
    removeFromLocalStorage: function(){
        localStorage.removeItem('lightbox_photo');
    },
    //append lightbox html
    appendLightBox: function(){
        var self =  this;
        var lightBox = document.createElement('div');
        lightBox.className = 'lightbox';
        var lightboxHtml = '<div class="photo-container"></div>';
        lightBox.innerHTML = lightboxHtml;
        var grid = self.getElements(self.options.gridClassName);
        var container=  self.getElements('container');
        container.insertBefore(lightBox,grid);
    },
    appendPagination: function(){
        var self = this;
        var pagination = document.createElement('div');
        self.addClass(pagination,'pagination');
        pagination.innerHTML = '<button class="next float-right" href="#">❯</button><button class="prev float-left" href="#">❮</button>';
        var lightbox = self.getElements('lightbox');
        var photoContainer = document.createElement('div');
        photoContainer.className = 'photo-container';
        photoContainer  = self.getElements('photo-container');
        lightbox.insertBefore(pagination,photoContainer);

    },
    setDefaults: function(optionsObj){
        var self = this;
        self.options = Object.create(optionsObj);

        if(optionsObj.gridPhotoSize == ""){
            delete optionsObj.gridPhotoSize;
        }
        if(optionsObj.lightBoxPhotoSize == ""){
            delete optionsObj.lightBoxPhotoSize;
        }
        self.options.gridPhotoSize = optionsObj.gridPhotoSize ? 'url_'+optionsObj.gridPhotoSize : 'url_m';
        self.options.gridPhotoWidth = optionsObj.gridPhotoSize ?'width_'+optionsObj.gridPhotoSize : 'width_m';
        self.options.gridPhotoHeight = optionsObj.gridPhotoSize ? 'height_'+optionsObj.gridPhotoSize : 'height_m';

        self.options.lightBoxPhotoSize = optionsObj.lightBoxPhotoSize ? 'url_'+optionsObj.lightBoxPhotoSize : 'url_o';
        self.options.lightBoxPhotoWidth = optionsObj.lightBoxPhotoSize ? 'width_'+optionsObj.lightBoxPhotoSize : 'width_o';
        self.options.lightBoxPhotoHeight = optionsObj.lightBoxPhotoSize ? 'height_'+optionsObj.lightBoxPhotoSize : 'height_o';
    },
    //init 
    init:function(options){
        var self = this;
        
        self.setDefaults(options);
        self.appendLightBox();
        self.appendPagination();
        //get photos
        self.getPhotos(function(response){
            if(response){
                var resultList = JSON.parse(response);
                if(resultList.photoset && resultList.photoset.photo){
                    //render photos
                    self.photosCount = resultList.photoset.photo.length;
                    self.photosList = resultList.photoset.photo;
                    self.renderPhotos('lightbox-grid',resultList.photoset.photo);
                }
            }
        });
        self.bindNavAway();
        
    },
    //get photos method 
    getPhotos: function(callback){
        var url = this.urlMap.getPhotos;
        url = url.format(this.constants.api_key,this.constants.photoset_id,this.constants.user_id);
        this.makeAjaxCall(url,'get',null,function(response){
            if(response && response.status ===200 ){
                callback(response.responseText);
            }else{
                callback('There was an error processing your request!');
            }
        });
    },
    //helper to get index of photo from list
    getPhotoIndexFromList: function(photo){
        var index;
        this.photosList.filter(function(item,key){
            if(item.id === photo.id){
                index = key;
            }
        });
        return index;
    },
    //paginate handler 
    paginate: function(photo,direction){
        var index = this.getPhotoIndexFromList(photo);
        var photoToLoad = {};
        if(direction == 'next'){
            photoToLoad = this.photosList[index+1];
        }else{
            photoToLoad = this.photosList[index-1];
        }

        this.togglePagination(photoToLoad);

        if(photoToLoad){
            this.lightBox(photoToLoad);
        }
    },
    //helper to enable/disable pagination arrows
    togglePagination :function(photo){
        var photoIndex = this.getPhotoIndexFromList(photo);
        //attach click events for next / prev
        var next = this.getElements('next');
        var prev = this.getElements('prev');

        if(photoIndex === 0){
            this.disableElem(prev);
        }else{
            this.enableElem(prev);
        }
        if(photoIndex === (this.photosList.length-1) ){
            this.disableElem(next);
        }else{
            this.enableElem(next);
        }

    },
    //method to attach kep press event handlers
    bindKeyPressEvents: function(photo){
        self = this;
        document.onkeydown = function(e) {
         e = e || window.event;
        switch(e.which || e.keyCode) {
            case 37: // left
            if(self.getPhotoIndexFromList(photo)!==0){
                self.paginate(photo,'prev');
            }
            break;

            case 39: // right
            if(self.getPhotoIndexFromList(photo)!== self.photosList.length-1){
                self.paginate(photo,'next');
            }
            break;

            default: return; // exit this handler for other keys
        }
            e.preventDefault();
        };

    },
    closeLightBox: function(){
        var self = this;
        var lightbox = self.getElements('lightbox');
        var lightBoxOverlay = self.getElements('lightbox-overlay');
        self.hideElement(lightBoxOverlay);
        self.hideElement(lightbox);
        self.removeFromLocalStorage();
    },
    //close light box
    bindCloseLightBox:function(){
        var self = this;
        var body = self.getElements('body');

        body.onclick = function(e){
            if(e.target.className === 'lightbox'){
                self.closeLightBox();
            }
        };
    },
    bindNavAway: function(){
        var self = this;
        var body = self.getElements('body');
        body.onload = function(evt){
            var photo = JSON.parse(window.localStorage.getItem('lightbox_photo'));
            if(photo && Object.keys(photo).length){
                self.lightBox(photo);
            }
        };
    },
    //show light box
    lightBox: function(photo){
        var self = this;

        self.saveToLocalStorage(photo);
        self.lightBoxMap = {};

        var lightbox = self.getElements('lightbox');
        var photoContainer =  self.getElements('photo-container');
        var lightBoxOverlay = self.getElements('lightbox-overlay');
        
        self.bindCloseLightBox(lightBoxOverlay,lightbox);
        self.bindKeyPressEvents(photo);
        self.bindNavAway();
        self.positionPaginationButtons(photo);

        self.showElement(lightBoxOverlay);
        self.addClass(lightBoxOverlay,'active');

        var img_url = photo[self.options.lightBoxPhotoSize];
        var width = photo[self.options.lightBoxPhotoWidth];
        var height = photo[self.options.lightBoxPhotoHeight];
        
        var imageHtml = '';
        imageHtml += '<div style="margin:auto; width: '+width+'px; height: '+height+'px;background-image:url(\''+img_url+'\')" class="photo margin-xx-small" ></div>';

        photoContainer.style.width  = width+'px';
        photoContainer.style.height  = height+'px';
        photoContainer.style.margin  = 'auto';
        photoContainer.innerHTML = imageHtml;

        self.showElement(lightbox);

        self.togglePagination(photo);
        
        self.lightBoxMap[photo] = true;

    },
    //adjust pagination postion based on image size
    positionPaginationButtons: function(photoObj){
        var pagination = this.getElements('pagination');
        var next = this.getElements('next');
        var prev = this.getElements('prev');

        pagination.style.width = photoObj.width_o+'px';
        next.style.marginTop = (photoObj.height_o/2)+'px';
        prev.style.marginTop = (photoObj.height_o/2)+'px';

        next.onclick = function(evt){
            self.paginate(photo,'next');
        };

        prev.onclick = function(evt){
            self.paginate(photo,'prev');
        };
    },
    //add class helper
    addClass: function(elem,className){
        elem.className  += " " + className;
    },
    //disalbe element helper
    disableElem: function(elem){
        elem.disabled = true;
    },
    //enable element helper
    enableElem: function(elem){
        elem.disabled = false;
    },
    //get elements by class name 
    getElements : function(className){
        return document.getElementsByClassName(className)[0];
    },
    //get element by id
    getElement: function(id){
        return document.getElementById(id)[0];
    },
    //show element helper
    showElement: function(elem){
        elem.style.display = 'block';
    },
    //hide element helper
    hideElement: function(elem){
        elem.style.display = 'none';
    },
    //render photo grid
    renderPhotos: function(className,records){
        var self = this;
        var photoGrid = self.getElements(className);
        var recordsLength = records.length;
        var photos = document.createElement("div");
        photoGrid.appendChild(photos);
        var onclickHandler = function(elem) {
            return function(){
               self.lightBox(elem);
            };
        };
        for(var i=0; i< recordsLength; i++){
            //url_sq, url_t, url_s, url_m, url_o
            var item = records[i];

            var img_url = records[i][self.options.gridPhotoSize];
            var width = records[i][[self.options.gridPhotoWidth]];
            var height = records[i][[self.options.gridPhotoHeight]];
            var photo = document.createElement("div");
            var imageHtml = '';
            imageHtml += '<div style="float:left; width: '+width+'px; height: '+height+'px;background-image:url(\''+img_url+'\')" class="photo margin-xx-small" ></div>';
            photo.innerHTML  = imageHtml;
            photo.onclick = onclickHandler(item);
            photos.appendChild(photo);
        }
        photoGrid.appendChild(photos);
    }
};











