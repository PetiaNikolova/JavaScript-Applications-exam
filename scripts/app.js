function startApp() {
    const app = Sammy('#container', function () {
        this.use('Handlebars', 'hbs');
        $(document).on({
            ajaxStart: function () {
                $("#loadingBox").show();
            },
            ajaxStop: function () {
                $("#loadingBox").hide();
            }
        });
        // Home Page
        this.get('index.html', displayHome);
        this.get('#/home', displayHome);
        // Login
        this.post('#/login', function (ctx) {
            let username = ctx.params.username;
            let password = ctx.params.password;

            auth.login(username, password)
                .then(function (userInfo) {
                    auth.saveSession(userInfo);
                    auth.showInfo('Login successful.');
                    ctx.redirect('#/catalog');
                }).catch(auth.handleError);


        });
        // Register
        this.post('#/register', function (ctx) {
            let username = ctx.params.username;
            let password = ctx.params.password;
            let repeatPass = ctx.params.repeatPass;
            let isValid = isValidRegister(username, password, repeatPass);
            if (isValid) {
                auth.register(username, password, repeatPass)
                    .then(function (userInfo) {
                        auth.saveSession(userInfo);
                        auth.showInfo('User registration successful.');
                        ctx.redirect('#/catalog');
                    }).catch(auth.handleError)
            }

        });
        // Logout
        this.get('#/logout', function (ctx) {
            auth.logout().then(function () {
                sessionStorage.clear();
                auth.showInfo('Logout successful.');
                ctx.redirect('#/home');
            }).catch(auth.handleError)
        });
        //Catalog
        this.get('#/catalog', displayCatalog);
        // Edit
        this.get('#/edit/:id', function (ctx) {
            ctx.isAnonymous = sessionStorage.getItem('authtoken') === null;
            ctx.username = sessionStorage.getItem('username');

            let postId = ctx.params.id.substr(1);
            loadService.postDetails(postId)
                .then(function (postInfo) {
                    ctx.isAnonymous = sessionStorage.getItem('username') === null;
                    ctx.username = sessionStorage.getItem('username');
                    ctx.postId = postId;
                    ctx.url = postInfo.url;
                    ctx.title = postInfo.title;
                    ctx.imageUrl = postInfo.image;
                    ctx.description = postInfo.description;

                    ctx.loadPartials({
                        header: './templates/common/header.hbs',
                        footer: './templates/common/footer.hbs',
                        navigation: './templates/common/navigation.hbs',
                        editForm: './templates/editPost/editForm.hbs'
                    }).then(function () {
                        this.partial('./templates/editPost/editPage.hbs');
                    })
                }).catch(auth.handleError);

        });
        this.post('#/edit/:id', function (ctx) {
            let postId = ctx.params.id.substr(1);
            let author = sessionStorage.getItem('username');
            let url = ctx.params.url;
            let title = ctx.params.title;
            let imageUrl = ctx.params.image;
            let description = ctx.params.description;
            if(validateCreatePost(url, title)) {
                let data = {
                    author,
                    url,
                    title,
                    imageUrl,
                    description
                };
                loadService.editPost(data, postId)
                    .then(function () {
                        auth.showInfo(`Post ${title} updated!`);
                        ctx.redirect('#/catalog');
                    }).catch(auth.handleError)
            }
        });

        // Create
        this.get('#/create', function (ctx) {
            ctx.isAnonymous = sessionStorage.getItem('username') === null;
            ctx.username = sessionStorage.getItem('username');

            ctx.loadPartials({
                header: './templates/common/header.hbs',
                footer: './templates/common/footer.hbs',
                navigation: './templates/common/navigation.hbs',
                createForm: './templates/createPost/createForm.hbs'
            }).then(function () {
                this.partial('./templates/createPost/createPage.hbs');
            })
        });
        this.post('#/create', function (ctx) {
            let url = ctx.params.url;
            let title = ctx.params.title;
            if (validateCreatePost(url, title)) {
                let data = {
                    author: sessionStorage.getItem('username'),
                    url,
                    title,
                    imageUrl: ctx.params.image,
                    description: ctx.params.comment
                };
                loadService.createPost(data)
                    .then(function () {
                        auth.showInfo('Post created.');
                        ctx.redirect('#/catalog');
                    }).catch(auth.handleError)
            }
        });

        // MyPosts
        this.get('#/myPosts', displayMyCatalog);

        //Delete
        this.get('#/delete/:id', function (ctx) {
            let postId = ctx.params.id.substr(1);
            loadService.deletePost(postId)
                .then(function () {
                    auth.showInfo('Post deleted.');
                    ctx.redirect('#/catalog')
                }).catch(auth.handleError)
        });
        this.get('#/deleteComment/:id', function (ctx) {
            let postId = ctx.params.id.substr(1);
            loadService.deleteComment(postId)
                .then(function () {
                    auth.showInfo('Post deleted.');
                    window.history.go(-1);
                }).catch(auth.handleError)
        });

        // Details
        this.get('#/comments/:id', function (ctx) {
            ctx.isAnonymous = sessionStorage.getItem('username') === null;
            ctx.username = sessionStorage.getItem('username');

            let postId = ctx.params.id.substr(1);

            loadService.postDetails(postId).then(function (postInfo) {
                ctx.isAuthor= postInfo.author === sessionStorage.getItem('username');
                ctx.url = postInfo.url;
                ctx.imageUrl = postInfo.imageUrl;
                ctx.title = postInfo.title;
                ctx.description = postInfo.description;
                ctx.date = calcTime(postInfo._kmd.ect);
                ctx.author = postInfo.author;
                ctx._id = postInfo._id;

                loadService.viewComments(postId).then(function (comments) {
                    for (let comment of comments) {
                        comment.isAuthor = comment.author === sessionStorage.getItem('username');
                        ctx.date = calcTime(comment._kmd.ect);
                    }
                    ctx.comments = comments;
                    ctx.loadPartials({
                        header: './templates/common/header.hbs',
                        footer: './templates/common/footer.hbs',
                        navigation: './templates/common/navigation.hbs',
                        post: './templates/comments/post.hbs',
                        form: './templates/comments/form.hbs',
                        comment: './templates/comments/comments.hbs'
                    }).then(function () {
                        this.partial('./templates/comments/detailPage.hbs')
                    })
                }).catch(auth.handleError);
            }).catch(auth.handleError);
        });
        this.post('#/comments/:id', function (ctx) {
            let postId = ctx.params.id.substr(1);
            let data = {
                content: ctx.params.content,
                author: sessionStorage.getItem('username'),
                postId: postId
            };
            loadService.createComment(data)
                .then(function () {
                    auth.showInfo('Comment created.');
                    ctx.redirect(`#/comments/:${postId}`);
                }).catch(auth.handleError)
        });

        function validateCreatePost(url, title) {
            if (url === "") {
                auth.showError('Link url should not be empty!');
                return false;
            }

            if (title === "") {
                auth.showError('Post title should not be empty!');
                return false;
            }

            if (!url.startsWith('http')) {
                auth.showError('Url should be a valid link!');
                return false;
            }

            return true;
        }

        function isValidRegister(username, pass, repeatPass) {
            if (!/^[a-zA-Z]{3,}$/g.test(username)) {
                auth.showInfo('Username should be only english alphabet letters with length at least 3 symbols');
                return false;
            }
            if (!/^[a-zA-Z0-9]{6,}$/g.test(pass)) {
                auth.showInfo('Password should be only english alphabet letters and digits with length at least 6 symbols');
                return false;
            }
            if (pass !== repeatPass) {
                auth.showInfo('Passwords do not match');
                return false;
            }
            return true;
        }

        function displayMyCatalog(ctx) {
            ctx.isAnonymous = sessionStorage.getItem('authtoken') === null;
            ctx.username = sessionStorage.getItem('username');

            let username = sessionStorage.getItem('username');
            loadService.myPosts(username)
                .then(function (posts) {
                    for (let post of posts) {
                        let datePost = post._kmd.ect;
                        let date = calcTime(datePost);
                        post['date'] = date;
                        post.isAuthor = post.author === sessionStorage.getItem('username');
                    }
                    Handlebars.registerHelper("counter", function (index) {
                        return index + 1;
                    });
                    ctx.posts = posts;

                    ctx.loadPartials({
                        header: './templates/common/header.hbs',
                        footer: './templates/common/footer.hbs',
                        navigation: './templates/common/navigation.hbs',
                        post: './templates/catalog/article.hbs'
                    }).then(function () {
                        this.partial('./templates/myPosts/myPage.hbs')
                    })
                }).catch(auth.handleError)
        }

        function displayCatalog(ctx) {
            ctx.isAnonymous = sessionStorage.getItem('authtoken') === null;
            ctx.username = sessionStorage.getItem('username');

            loadService.listAllPosts()
                .then(function (posts) {
                    for (let post of posts) {
                        let datePost = post._kmd.ect;
                        let date = calcTime(datePost);
                        post['date'] = date;
                        post.isAuthor = post.author === sessionStorage.getItem('username');
                    }
                    Handlebars.registerHelper("counter", function (index) {
                        return index + 1;
                    });

                    ctx.posts = posts;

                    ctx.loadPartials({
                        header: './templates/common/header.hbs',
                        footer: './templates/common/footer.hbs',
                        navigation: './templates/common/navigation.hbs',
                        article: './templates/catalog/article.hbs'
                    }).then(function () {
                        this.partial('./templates/catalog/catalogPage.hbs')
                    })
                }).catch(auth.handleError)

        }

        function displayHome(ctx) {
            ctx.isAnonymous = sessionStorage.getItem('authtoken') === null;
            ctx.username = sessionStorage.getItem('username');
            if (ctx.isAnonymous) {
                ctx.loadPartials({
                    header: './templates/common/header.hbs',
                    footer: './templates/common/footer.hbs',
                    login: './templates/home/loginForm.hbs',
                    register: './templates/home/registerForm.hbs',
                    welcome: './templates/home/welcome.hbs'
                }).then(function () {
                    this.partial('./templates/home/homePage.hbs');
                })
            } else {
                ctx.redirect('#/catalog')
            }
        }

        function calcTime(dateIsoFormat) {
            let diff = new Date - (new Date(dateIsoFormat));
            diff = Math.floor(diff / 60000);
            if (diff < 1) return 'less than a minute';
            if (diff < 60) return diff + ' minute' + pluralize(diff);
            diff = Math.floor(diff / 60);
            if (diff < 24) return diff + ' hour' + pluralize(diff);
            diff = Math.floor(diff / 24);
            if (diff < 30) return diff + ' day' + pluralize(diff);
            diff = Math.floor(diff / 30);
            if (diff < 12) return diff + ' month' + pluralize(diff);
            diff = Math.floor(diff / 12);
            return diff + ' year' + pluralize(diff);

            function pluralize(value) {
                if (value !== 1) return 's';
                else return '';
            }
        }
    });
    app.run();
}