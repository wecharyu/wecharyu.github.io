# `wechar's blog`

## Quick Start

- Prepare [jekyll environment](https://jekyllrb.com/docs/installation/)

- Start service
```bash
$ git clone https://github.com/wecharyu/wecharyu.github.io.git
$ cd wecharyu.github.io
$ bundle install
$ bundle exec jekyll serve -H 0.0.0.0  --port 80 --trace
```

## Dev Document
### Branch Details
- master: the structural code of the website, excluding the real blogs.
- posts: the real blogs to show, including the latest master code.
- gh-pages: the site data build by workflows for github pages.
### Code Push
As we used the workflows of github to deploy our website, we should create a PR to **posts branch** to ensure the build sucess.
