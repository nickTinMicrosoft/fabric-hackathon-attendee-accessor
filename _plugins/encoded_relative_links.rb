require "uri"
require "jekyll-relative-links"

# The GitHub Pages version compares encoded Markdown links with decoded filenames.
module EncodedRelativeLinks
  private

  def path_from_root(relative_path, url_base)
    super(URI::DEFAULT_PARSER.unescape(relative_path), url_base)
  end
end

JekyllRelativeLinks::Generator.prepend(EncodedRelativeLinks)
