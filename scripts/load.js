let loadService = (() => {

    function listAllPosts() {
        let endpoint=`posts?query={}&sort={"_kmd.ect": -1}`;
        return requester.get('appdata',endpoint, 'Kinvey' );

    }

    function createPost(data) {
        return requester.post('appdata', 'posts', 'kinvey', data)
    }

    function editPost(data, post_id) {
        let endPoint='posts/'+post_id;
        return requester.update('appdata', endPoint, 'kinvey', data)
    }

    function deletePost(post_id) {
        let endPoint=`posts/${post_id}`;
        return requester.remove('appdata',endPoint, 'kinvey');
    }

    function myPosts(username) {
        let endPoint=`posts?query={"author":"${username}"}&sort={"_kmd.ect": -1}`;
        return requester.get('appdata',endPoint, 'kinvey');
    }

    function postDetails(post_id) {
        return requester.get('appdata', `posts/${post_id}`, 'kinvey');
    }

    function viewComments(post_id) {
        let endPoint=  `comments?query={"postId":"${post_id}"}&sort={"_kmd.ect": -1}`;
        return requester.get('appdata', endPoint, 'kinvey');
    }

    function createComment(data) {
        return requester.post('appdata', 'comments', 'kinvey', data);
    }

    function deleteComment(comment_id) {
        return requester.remove('appdata', `comments/${comment_id}`, 'kinvey');
    }
    return {
        listAllPosts,
        createPost,
        editPost,
        deletePost,
        myPosts,
        postDetails,
        viewComments,
        createComment,
        deleteComment
    }
})();