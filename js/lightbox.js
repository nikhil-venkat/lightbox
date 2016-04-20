var lightBoxService = function(){};


lightBoxService.prototype = {
    constants: {
        api_key: '537bf7faeb91ed343869d2c61a06e8c7',
        photoset_id:'72157666970496405',
        user_id: '94943647%40N02',
        auth_token: '72157667123991002-339d14e3f413211b',
        api_sig: 'cb096a8cb0eacc282600507beecb70f5'
    },
    urlMap: {
        //getPhotos: "https://api.flickr.com/services/rest/?method=flickr.photosets.getPhotos&api_key=537bf7faeb91ed343869d2c61a06e8c7&photoset_id=72157666970496405&user_id=94943647%40N02&extras=url_sq%2C+url_t%2C+url_s%2C+url_m%2C+url_o&format=json&nojsoncallback=1&auth_token=72157667123991002-339d14e3f413211b&api_sig=cb096a8cb0eacc282600507beecb70f5"
        getPhotos: "https://api.flickr.com/services/rest/?method=flickr.photosets.getPhotos&api_key={0}&photoset_id={1}&user_id={2}&extras=url_sq%2C+url_t%2C+url_s%2C+url_m%2C+url_o&format=json&nojsoncallback=1&auth_token={3}&api_sig={4}"
    },
    photosCount: 0,
    photosList: [],
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
    init:function(options){
        var self = this;
        var pagination = document.createElement('div');
        self.addClass(pagination,'pagination');
        pagination.innerHTML = '<a class="next float-right" href="#">next</a><a class="prev float-left" href="#">prev</a>';
        var lightbox = this.getElements('lightbox');
        var photoContainer = this.getElements('photo-container');
        lightbox.insertBefore(pagination,photoContainer);
        
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
    },
    getPhotos: function(callback){
        var url = this.urlMap.getPhotos;
        url = url.format(this.constants.api_key,this.constants.photoset_id,this.constants.user_id,this.constants.auth_token,this.constants.api_sig);
        this.makeAjaxCall(url,'get',null,function(response){
            if(response && response.status ===200 ){
                callback(response.responseText);
            }else{
                callback('There was an error processing your request!');
            }
        });
    },
    getPhotoIndexFromList: function(photo){
        var index;
        this.photosList.filter(function(item,key){
            if(item.id === photo.id){
                index = key;
            }
        });
        return index;
    },
    paginate: function(photo,direction){
        console.log(photo);
        console.log(direction);
    },
    lightBox: function(photo){
        var self = this;

        var lightbox = self.getElements('lightbox');
        var photoContainer =  this.getElements('photo-container');
        var lightBoxOverlay = this.getElements('lightbox-overlay');
        
        this.showElement(lightBoxOverlay);

        this.addClass(lightBoxOverlay,'active');

        var img_url = photo.url_m;
        var width = photo.width_m;
        
        var height = photo.height_m;
        
        this.setUpPagination(photo);

        var imageHtml = '';
        imageHtml += '<div style="margin:auto; width: '+width+'px; height: '+height+'px;background-image:url(\''+img_url+'\')" class="photo margin-xx-small" ></div>';
        photoContainer.innerHTML = imageHtml;

        this.showElement(lightbox);

        var photoIndex = this.getPhotoIndexFromList(photo);
        //attach click events for next / prev
        var next = this.getElements('next');
        var prev = this.getElements('prev');

        if(photoIndex === 0){
            this.disableElem(prev);
        }
        if(photoIndex === this.photosList.length){
            this.disableElem(next);
        }
        next.onclick = function(photo,evt){
            self.paginate(photo,'next');
        };

        prev.onclick = function(photo,evt){
            self.paginate(photo,'prev');
        };
    },
    setUpPagination: function(photoObj){
        var pagination = this.getElements('pagination');
        var next = this.getElements('next');
        var prev = this.getElements('prev');

        pagination.style.width = photoObj.width_m+'px';
        next.style.marginTop = (photoObj.height_m/2)+'px';
        prev.style.marginTop = (photoObj.height_m/2)+'px';
    },
    addClass: function(elem,className){
        elem.className  += " " + className;
    },
    disableElem: function(elem){
        elem.disabled = true;
    },
    enableElem: function(elem){
        elem.disabled = false;
    },
    getElements : function(className){
        return document.getElementsByClassName(className)[0];
    },
    getElement: function(id){
        return document.getElementById(id)[0];
    },
    showElement: function(elem){
        elem.style.display = 'block';
    },
    hideElement: function(elem){
        elem.style.display = 'hidden';
    },
    renderPhotos: function(className,records){
        var self = this;
        var photoGrid = this.getElements(className);
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
            var img_url = records[i].url_m;
            var width = records[i].width_m;
            var height = records[i].height_m;
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

//String format function
if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) {
      return typeof args[number] != 'undefined'? args[number]: match;
    });
  };
}









