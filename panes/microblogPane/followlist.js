 /*
    FOLLOW LIST
    store the uri's of followed users for dereferencing the @replies
*/
var FollowList = function(){
    this.userlist = {};
    this.uris = {};
}
FollowList.prototype.add = function(user,uri){
    if (followlist.userlist[user]){
        if (uri in followlist.uris){
            //do nothing here, the user has already added the user
            //at some point this session.
        }else{
            this.userlist[user].push(uri);
            this.uris[uri] = "";
        }
    }else{
        followlist.userlist[user] = [uri];
    }
}
FollowList.prototype.selectUser= function(user){
    if (this.userlist[user]){
        if (this.userlist[user].length == 1){
            //user follows only one user with nick
            return [true, this.userlist[user]];
        }else if (followlist.userlist[user].length > 1){
            //user follows multiple users with this nick.
            return [false, this.userlist[user]];
        }
    }else{
        //user does not follow any users with this nick
        return [false, []] ;
    }
}
