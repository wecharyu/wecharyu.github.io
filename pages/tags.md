---
title: "Tags"
layout: archive
permalink: /tags
lang: en
---

<link rel="stylesheet" href="/assets/css/paginator.css">
<link rel="stylesheet" href="/assets/css/post-meta.css">

{% assign words = site.tags %}
{% include word-cloud.html %}

<ul>
  {% for tag in site.tags %}
  <li>
    <h2 id='{{ tag[0] | slugify }}' class='archive-subtitle'>{{tag[0]}}</h2>
    {% assign posts = tag[1] %}
    {% include paginator.html %}
  </li>
  {% endfor %}
</ul>
